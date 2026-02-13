import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the build directory (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing: redirect all non-file requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  🚀 Industrial Viewport Pro Web Server Started!
  -----------------------------------------------
  📡 Local:   http://localhost:${PORT}
  📂 Serving: ${path.join(__dirname, 'dist')}
  -----------------------------------------------
  `);
});