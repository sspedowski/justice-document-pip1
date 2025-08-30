const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const GUEST = { id: 'guest', role: 'guest', name: 'Guest' };
const requireAuth = (req, _res, next) => { req.user = GUEST; next(); };

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/me', requireAuth, (req, res) => res.json({ user: req.user }));
app.post('/api/submit', requireAuth, (req, res) => {
  res.json({ ok: true, received: req.body?.message || '', user: req.user });
});

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
