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

app.get("/health", (_, res) => res.json({ ok: true }));

// Guest-friendly /api/me: returns verified JWT payload if present, else guest
app.get("/api/me", (req, res) => {
  const token = req.cookies?.token || (req.headers.authorization || "").split(" ")[1];
  if (token) {
    try {
      return res.json(jwt.verify(token, S));
    } catch (e) {
      // fall through to guest
    }
  }
  return res.json({ id: "guest", role: "guest", name: "Guest" });
});

// Optional: you may keep or remove login/logout/refresh routes for pure guest mode

app.listen(3001, () => console.log("api on 3001"));
