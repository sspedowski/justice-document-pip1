const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const S = process.env.JWT_SECRET || "dev";
const E = process.env.ADMIN_EMAIL || "admin@example.com";
const H = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync("changeme", 10);

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing" });
  if (email !== E || !(await bcrypt.compare(password, H)))
    return res.status(401).json({ error: "Invalid credentials" });
  res.json({ token: jwt.sign({ sub: email }, S, { expiresIn: "2h" }) });
});

app.get("/api/me", (req, res) => {
  try {
    const t = (req.headers.authorization || "").replace(/^Bearer\s+/, "");
    const p = jwt.verify(t, S);
    res.json({ email: p.sub });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.listen(3001, () => console.log("api on 3001"));
