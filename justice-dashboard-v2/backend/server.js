const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const S = process.env.JWT_SECRET || "dev";
const E = process.env.ADMIN_EMAIL || "admin@example.com";
const H = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync("changeme", 10);

const sign = (payload) => jwt.sign(payload, S, { expiresIn: "15m" });
const auth = (req, _res, next) => {
  try {
    const t = req.cookies.token || (req.headers.authorization || "").replace(/^Bearer\s+/, "");
    req.user = t ? jwt.verify(t, S) : null;
  } catch {
    req.user = null;
  }
  next();
};

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing" });
  if (email !== E || !(await bcrypt.compare(password, H)))
    return res.status(401).json({ error: "Invalid credentials" });

  const token = sign({ sub: email, role: "admin" });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
    maxAge: 15 * 60 * 1000,
  });
  res.json({ ok: true });
});

app.get("/api/me", auth, (req, res) => {
  if (!req.user) return res.status(401).end();
  res.json(req.user);
});

app.post("/api/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

app.listen(3001, () => console.log("api on 3001"));
