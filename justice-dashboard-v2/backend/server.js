const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

const PORT = process.env.PORT ?? 3001;
const S = process.env.JWT_SECRET || "dev";
const GUEST = { id: "guest", role: "guest", name: "Guest" };

app.get("/health", (_, res) => res.json({ ok: true }));
app.get("/api/health", (_, res) => res.json({ ok: true }));

// Force guest identity for all protected routes
function requireAuth(req, _res, next) {
  req.user = GUEST;
  next();
}

// Always return guest for /api/me (wrapped)
app.get("/api/me", requireAuth, (req, res) => res.json({ user: req.user }));

// Simple ping endpoint to test wiring
app.get("/api/ping", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Dev-only ping endpoint
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/_ping', requireAuth, (req, res) => {
    res.json({ ok: true, user: req.user });
  });
}

// Sample submit endpoint
app.post("/api/submit", requireAuth, (req, res) => {
  const { message } = req.body || {};
  res.json({ ok: true, received: message ?? null, user: req.user });
});

// Optional: you may keep or remove login/logout/refresh routes for pure guest mode

app.listen(PORT, () => console.log(`api on ${PORT}`));
