import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'industrial-viewport-secret-key-change-me';
const DB_PATH = path.join(__dirname, 'database.sqlite');

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// DATABASE SETUP
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
    } else {
        console.log('💾 Connected to SQLite database.');
        initializeDB();
    }
});

function initializeDB() {
    db.serialize(async () => {
        // Create Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            role TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Check for Admin User (Bootstrapping)
        db.get("SELECT count(*) as count FROM users", async (err, row) => {
            if (row && row.count === 0) {
                console.log('⚠️ No users found. Creating default admin...');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const stmt = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");
                stmt.run('admin', hashedPassword, 'ADMIN');
                stmt.finalize();
                console.log('✅ Default Admin created: User: admin | Pass: admin123');
            }
        });
    });
}

// AUTH MIDDLEWARE
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
};

// --- API ROUTES ---

// 1. Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '12h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });
});

// 2. Register (Admin Only)
app.post('/api/auth/register', authenticateToken, requireAdmin, async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'OPERATOR';

        const stmt = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");
        stmt.run(username, hashedPassword, userRole, function(err) {
            if (err) {
                if(err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Usuário já existe' });
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, username, role: userRole });
        });
        stmt.finalize();
    } catch (e) {
        res.status(500).json({ error: 'Error creating user' });
    }
});

// 3. Validate Token / Get Me
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// 4. List Users (Admin Only)
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
    db.all("SELECT id, username, role, created_at FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// 5. Delete User (Admin Only)
app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const id = req.params.id;
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

    db.run("DELETE FROM users WHERE id = ?", id, function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'User deleted' });
    });
});


// SPA FALLBACK
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  🚀 Industrial Viewport Pro Server Started!
  -----------------------------------------------
  🔐 Auth:    Enabled (SQLite + JWT)
  📡 API:     http://localhost:${PORT}/api
  📂 Serving: ${path.join(__dirname, 'dist')}
  -----------------------------------------------
  `);
});