// Justice Dashboard Server (minimal, test-friendly)
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");

// Load environment variables (prefer local .env if present)
const dotenvPath = [
  path.join(__dirname, ".env"),
  path.join(process.cwd(), "justice-server", ".env"),
  path.join(process.cwd(), ".env"),
].find((p) => fs.existsSync(p));
if (dotenvPath) {
  require("dotenv").config({ path: dotenvPath });
}

// Config
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpass";

// App
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Ensure uploads directory exists and is publicly served
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir, { fallthrough: true }));

// Multer setup for PDF uploads
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || path.extname(file.originalname).toLowerCase() === ".pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Auth: login to get a JWT
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password required" });
  }
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ sub: username, role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
    return res.json({ success: true, user: { username, role: "admin" }, token });
  }
  return res.status(401).json({ success: false, error: "Invalid credentials" });
});

// Auth: logout (stateless JWT, so just acknowledge)
app.post("/api/logout", (_req, res) => res.json({ success: true }));

// JWT middleware
function requireAuth(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Upload + summarize endpoint (lightweight summary without PDF parsing)
app.post("/api/summarize", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const isPdf = req.file.mimetype === "application/pdf" || path.extname(req.file.originalname).toLowerCase() === ".pdf";
  if (!isPdf) return res.status(400).json({ error: "Only PDF files are allowed" });

  // Basic placeholder "summary" that’s deterministic for tests
  const fileURL = `/uploads/${req.file.filename}`;
  const summary = `Uploaded ${req.file.originalname} (${req.file.size} bytes)`;
  return res.status(201).json({ summary, fileURL });
});

// Global error handler (normalize Multer/file errors to 400)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const message = err && (err.message || err.toString());
  if (message && (message.includes("Only PDF files are allowed") || message.includes("File too large") || err.name === 'MulterError')) {
    return res.status(400).json({ error: message });
  }
  return res.status(500).json({ error: message || "Internal Server Error" });
});

// If run directly, start listening; when imported (tests), export app only
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Justice server listening on port ${PORT}`);
  });
}

module.exports = app;
