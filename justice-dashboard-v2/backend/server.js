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

const S = process.env.JWT_SECRET || "dev";
const E = process.env.ADMIN_EMAIL || "admin@example.com";
const H = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync("changeme", 10);

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "Lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const sign = (payload) => jwt.sign(payload, S, { expiresIn: "15m" });
const requireAuth = (req, res, next) => {
  try {
    const t = req.cookies.token || (req.headers.authorization || "").replace(/^Bearer\s+/, "");
    if (!t) throw new Error("no token");
    req.user = jwt.verify(t, S);
    next();
  } catch {
    res.status(401).json({ error: "unauthenticated" });
  }
};

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing" });
  if (email !== E || !(await bcrypt.compare(password, H)))
    return res.status(401).json({ error: "Invalid credentials" });

  const token = sign({ sub: email, role: "admin" });
  res
    .cookie("token", token, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 })
    .json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => res.json(req.user));

app.post("/api/refresh", requireAuth, (req, res) => {
  const fresh = sign({ sub: req.user.sub, role: req.user.role });
  res
    .cookie("token", fresh, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 })
    .json({ ok: true });
});

app.post("/api/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

app.listen(3001, () => console.log("api on 3001"));
