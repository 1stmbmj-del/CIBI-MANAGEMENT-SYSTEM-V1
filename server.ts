import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'ams-portal-default-secret-2026';

const db = new Database('ams_portal.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    mobileNumber TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL,
    photoURL TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_keys (
    key TEXT PRIMARY KEY,
    used INTEGER DEFAULT 0,
    createdBy TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    borrowerName TEXT NOT NULL,
    mobileNumber TEXT NOT NULL,
    accountType TEXT NOT NULL,
    location TEXT NOT NULL,
    tribe TEXT NOT NULL,
    businessPin TEXT,
    addressPin TEXT,
    requestedAmount REAL NOT NULL,
    term TEXT NOT NULL,
    intRate REAL NOT NULL,
    mop TEXT NOT NULL,
    top TEXT NOT NULL,
    ciOfficerId TEXT NOT NULL,
    ciOfficerName TEXT NOT NULL,
    status TEXT NOT NULL,
    timeline TEXT NOT NULL,
    approvedAmount REAL,
    approvedTerm TEXT,
    approvedIntRate REAL,
    approvedMop TEXT,
    approvedTop TEXT,
    crecomComments TEXT,
    netIncome REAL,
    ndiPercentage INTEGER,
    ndiValue REAL,
    validationResults TEXT,
    deniedComments TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(ciOfficerId) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { fullName, mobileNumber, role, password, adminKey } = req.body;
    
    try {
      // Check if user exists
      const existing = db.prepare('SELECT * FROM users WHERE mobileNumber = ?').get(mobileNumber);
      if (existing) return res.status(400).json({ error: 'Mobile number already registered' });

      // Admin key validation
      if (role === 'admin' && mobileNumber !== '09327481042') {
        const keyData: any = db.prepare('SELECT * FROM admin_keys WHERE key = ? AND used = 0').get(adminKey);
        if (!keyData) return res.status(400).json({ error: 'Invalid or used admin key' });
        db.prepare('UPDATE admin_keys SET used = 1 WHERE key = ?').run(adminKey);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = Math.random().toString(36).substring(2, 15);
      const createdAt = new Date().toISOString();

      db.prepare('INSERT INTO users (id, fullName, mobileNumber, role, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, fullName, mobileNumber, role, hashedPassword, createdAt);

      const token = jwt.sign({ id, mobileNumber, role }, JWT_SECRET);
      res.json({ token, user: { id, fullName, mobileNumber, role, createdAt } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { mobileNumber, password } = req.body;
    try {
      const user: any = db.prepare('SELECT * FROM users WHERE mobileNumber = ?').get(mobileNumber);
      if (!user) return res.status(400).json({ error: 'User not found' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(400).json({ error: 'Invalid password' });

      const token = jwt.sign({ id: user.id, mobileNumber: user.mobileNumber, role: user.role }, JWT_SECRET);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user: any = db.prepare('SELECT id, fullName, mobileNumber, role, photoURL, createdAt FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  });

  app.patch('/api/auth/profile', authenticateToken, async (req: any, res) => {
    const { fullName, password } = req.body;
    try {
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare('UPDATE users SET fullName = ?, password = ? WHERE id = ?').run(fullName, hashedPassword, req.user.id);
      } else {
        db.prepare('UPDATE users SET fullName = ? WHERE id = ?').run(fullName, req.user.id);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Admin Key Routes ---
  app.get('/api/admin-keys', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const keys = db.prepare('SELECT * FROM admin_keys ORDER BY createdAt DESC').all();
    res.json(keys);
  });

  app.post('/api/admin-keys', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const key = Math.floor(1000 + Math.random() * 9000).toString();
    db.prepare('INSERT INTO admin_keys (key, createdBy, createdAt) VALUES (?, ?, ?)')
      .run(key, req.user.id, new Date().toISOString());
    res.json({ key });
  });

  // --- Assignment Routes ---
  app.get('/api/assignments', authenticateToken, (req: any, res) => {
    let assignments;
    if (req.user.role === 'admin') {
      assignments = db.prepare('SELECT * FROM assignments ORDER BY createdAt DESC').all();
    } else {
      assignments = db.prepare('SELECT * FROM assignments WHERE ciOfficerId = ? ORDER BY createdAt DESC').all(req.user.id);
    }
    
    // Parse JSON fields
    assignments = assignments.map((a: any) => ({
      ...a,
      timeline: JSON.parse(a.timeline),
      validationResults: a.validationResults ? JSON.parse(a.validationResults) : null
    }));
    
    res.json(assignments);
  });

  app.post('/api/assignments', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const id = Math.random().toString(36).substring(2, 15);
    const { borrowerName, mobileNumber, accountType, location, tribe, businessPin, addressPin, requestedAmount, term, intRate, mop, top, ciOfficerId, ciOfficerName } = req.body;
    const createdAt = new Date().toISOString();
    const timeline = JSON.stringify([{ step: 'Assigned', timestamp: createdAt }]);

    db.prepare(`
      INSERT INTO assignments 
      (id, borrowerName, mobileNumber, accountType, location, tribe, businessPin, addressPin, requestedAmount, term, intRate, mop, top, ciOfficerId, ciOfficerName, status, timeline, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, borrowerName, mobileNumber, accountType, location, tribe, businessPin, addressPin, requestedAmount, term, intRate, mop, top, ciOfficerId, ciOfficerName, 'Assigned', timeline, createdAt);

    res.json({ id });
  });

  app.patch('/api/assignments/:id', authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const current: any = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'Assignment not found' });

    // Check permissions
    if (req.user.role !== 'admin' && current.ciOfficerId !== req.user.id) {
      return res.sendStatus(403);
    }

    // Handle JSON fields
    if (updates.timeline) updates.timeline = JSON.stringify(updates.timeline);
    if (updates.validationResults) updates.validationResults = JSON.stringify(updates.validationResults);

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(', ');

    db.prepare(`UPDATE assignments SET ${setClause} WHERE id = ?`).run(...values, id);
    res.json({ success: true });
  });

  // --- User Management Routes ---
  app.get('/api/users', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const users = db.prepare('SELECT id, fullName, mobileNumber, role, createdAt FROM users').all();
    res.json(users);
  });

  app.delete('/api/users/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    // Prevent self-deletion
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // --- Officers List ---
  app.get('/api/officers', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const officers = db.prepare('SELECT id, fullName, role FROM users').all();
    res.json(officers);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
