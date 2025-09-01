// Justice Dashboard Server (minimal, test-friendly)
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
// const helmet = require("helmet"); // no longer used; server applies CSP header manually
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const csurf = require('csurf');

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
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpass";

// App
const app = express();
app.disable("x-powered-by");
// Single CSP header applied by the server. Remove any <meta http-equiv="Content-Security-Policy"> tags in HTML.
// Frontend should call /api (same origin via Vite proxy); allow Vite dev server & websocket for HMR.
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "connect-src 'self' http://localhost:5173 ws://localhost:5173",
      "script-src 'self' 'unsafe-inline' http://localhost:5173",
      "style-src 'self' 'unsafe-inline' http://localhost:5173",
      "img-src 'self' blob: data:",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  next();
});
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
// Cookies and CSRF protection (dev: secure false). In prod, set secure:true and proper sameSite.
app.use(cookieParser());
app.use(csurf({ cookie: { httpOnly: true, sameSite: 'lax', secure: false } }));

// Ensure uploads directory exists and is publicly served
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir, { fallthrough: true }));

// Serve legacy and frontend assets directly for the legacy dashboard page
// Resolve repo root robustly relative to this server file
const repoRoot = path.resolve(__dirname, '..');
const legacyDir = path.join(repoRoot, "legacy");
if (fs.existsSync(legacyDir)) {
  app.use("/legacy", express.static(legacyDir, { fallthrough: true }));
}
const frontendDir = path.join(repoRoot, "frontend");
if (fs.existsSync(frontendDir)) {
  app.use("/frontend", express.static(frontendDir, { fallthrough: true }));
}
// Expose only the browser-side auth manager under a safe path
app.get('/assets/auth-manager.js', (_req, res) => {
  const authFile = path.join(repoRoot, 'backend', 'auth-manager.js');
  if (fs.existsSync(authFile)) return res.sendFile(authFile);
  return res.status(404).end();
});

// Root redirect → legacy dashboard for convenience
app.get('/', (_req, res) => {
  return res.redirect('/legacy/index.html');
});

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

// Simple always-on health endpoint (non-namespaced)
app.get('/health', (_req, res) => res.json({ ok: true }));

// Namespaced API health (kept for compatibility)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Dev-only ping endpoint (authenticated) — useful for quick DevTools checks
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/_ping', requireAuth, (req, res) => {
    res.json({ ok: true, user: req.user, ts: Date.now() });
  });
}

// CSRF token endpoint (client can call to fetch token if needed)
app.get('/api/csrf-token', (req, res) => {
  try {
    return res.json({ csrfToken: req.csrfToken() });
  } catch {
    return res.status(500).json({ error: 'Unable to generate CSRF token' });
  }
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
