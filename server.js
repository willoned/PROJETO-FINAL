import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'dist')));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// --- File Upload Configuration ---
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

const LAYOUT_FILE = path.join(DATA_DIR, 'layout.json');

if (!fs.existsSync(LAYOUT_FILE)) fs.writeFileSync(LAYOUT_FILE, JSON.stringify({}, null, 2));

let lockState = { isLocked: false, user: null, socketId: null };

// --- Endpoints ---

app.get('/api/layout', (req, res) => {
    try { res.json(JSON.parse(fs.readFileSync(LAYOUT_FILE, 'utf-8') || '{}')); }
    catch (e) { res.json({}); }
});

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Construct public URL
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const server = app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
const wss = new WebSocketServer({ server, path: '/system-ws' });

function broadcast(data, excludeWs = null) {
  wss.clients.forEach(client => { if (client !== excludeWs && client.readyState === 1) client.send(JSON.stringify(data)); });
}

wss.on('connection', (ws) => {
  ws.id = Date.now() + Math.random().toString();
  if (lockState.isLocked) ws.send(JSON.stringify({ type: 'LOCK_STATUS', isLocked: true, user: lockState.user }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'REQUEST_LOCK':
        if (lockState.isLocked && lockState.socketId !== ws.id) ws.send(JSON.stringify({ type: 'LOCK_DENIED', user: lockState.user }));
        else {
          lockState = { isLocked: true, user: data.user, socketId: ws.id };
          ws.send(JSON.stringify({ type: 'LOCK_GRANTED' }));
          broadcast({ type: 'LOCK_STATUS', isLocked: true, user: data.user }, ws);
        }
        break;
      case 'RELEASE_LOCK':
        if (lockState.socketId === ws.id) {
          lockState = { isLocked: false, user: null, socketId: null };
          broadcast({ type: 'LOCK_STATUS', isLocked: false, user: null });
        }
        break;
      case 'SAVE_LAYOUT':
        fs.writeFileSync(LAYOUT_FILE, JSON.stringify(data.payload, null, 2));
        broadcast({ type: 'LAYOUT_UPDATED', payload: data.payload });
        break;
    }
  });

  ws.on('close', () => {
    if (lockState.socketId === ws.id) {
      lockState = { isLocked: false, user: null, socketId: null };
      broadcast({ type: 'LOCK_STATUS', isLocked: false, user: null });
    }
  });
});