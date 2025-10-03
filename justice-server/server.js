// Justice Dashboard Server (minimal, test-friendly)
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const crypto = require('crypto');

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
const ENV = process.env.NODE_ENV || "development";
const isProd = ENV === "production";
const isTest = ENV === "test";

const PORT = process.env.PORT || 3001;
const devSecretPath = path.join(__dirname, ".jwt-dev.secret");
let JWT_SECRET = (process.env.JWT_SECRET || "").trim();

if (!JWT_SECRET) {
  if (isProd) {
    console.error("[FATAL] JWT_SECRET environment variable is required in production. Exiting.");
    process.exit(1);
  }
  try {
    if (fs.existsSync(devSecretPath)) {
      JWT_SECRET = fs.readFileSync(devSecretPath, "utf8").trim();
    }
    if (!JWT_SECRET) {
      JWT_SECRET = crypto.randomBytes(48).toString("hex");
      fs.writeFileSync(devSecretPath, JWT_SECRET, { encoding: "utf8", mode: 0o600 });
      const relPath = path.relative(process.cwd(), devSecretPath);
      console.warn("[WARN] Generated a local JWT secret at " + relPath + ". Set JWT_SECRET to override.");
    } else if (!isTest) {
      const relPath = path.relative(process.cwd(), devSecretPath);
      console.warn("[WARN] Using stored development JWT secret from " + relPath + ". Set JWT_SECRET to override.");
    }
  } catch (error) {
    JWT_SECRET = crypto.randomBytes(48).toString("hex");
    console.warn("[WARN] Generated ephemeral development JWT secret; persistence failed: " + error.message);
  }
} else if (!isProd && !isTest) {
  console.info("[info] JWT_SECRET loaded from environment.");
}
process.env.JWT_SECRET = JWT_SECRET;

// Default admin creds; when running tests (Jest sets NODE_ENV='test') force known defaults
let ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpass";
if (isTest) {
  ADMIN_USERNAME = "admin";
  ADMIN_PASSWORD = "adminpass";
}
if (isProd && (ADMIN_USERNAME === "admin" || ADMIN_PASSWORD === "adminpass")) {
  console.error("[FATAL] ADMIN_USERNAME/ADMIN_PASSWORD must be set in production. Exiting.");
  process.exit(1);
} else if (!isTest && (ADMIN_USERNAME === "admin" || ADMIN_PASSWORD === "adminpass")) {
  console.warn("[WARN] Using default admin credentials. Set ADMIN_USERNAME and ADMIN_PASSWORD.");
}

// App
const app = express();
// Security headers via helmet (CSP handled manually below). Disable conflicting policies.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'no-referrer' },
}));
// Additional headers not covered or we want explicit values
app.use((_, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
app.disable("x-powered-by");
// Single CSP header applied by the server. Remove any <meta http-equiv="Content-Security-Policy"> tags in HTML.
// Frontend should call /api (same origin via Vite proxy); allow Vite dev server & websocket for HMR.
app.use((req, res, next) => {
  const viteDevSrc = "http://localhost:5173 http://localhost:5174";
  const viteWSSrc = "ws://localhost:5173 ws://localhost:5174";
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // Allow Vite dev server (5173 default and 5174 used in this repo) for HMR and assets in development
      `connect-src 'self' ${isProd ? '' : viteDevSrc} ${isProd ? '' : viteWSSrc}`,
      `script-src 'self' ${isProd ? '' : "'unsafe-inline' " + viteDevSrc}`, // unsafe-inline for Vite HMR styles
      `style-src 'self' 'unsafe-inline' ${isProd ? '' : viteDevSrc}`, // unsafe-inline for Vite HMR styles
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
// Cookies and CSRF protection. In tests we skip csurf entirely for simplicity.
app.use(cookieParser());
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'lax', secure: isProd } });
if (!isTest) {
  // Apply CSRF protection except for open auth endpoints used in API-style flows.
  // Also allow /api/summarize so file uploads in dev aren't blocked by CSRF.
  app.use((req, res, next) => {
    const openPaths = new Set([
      '/api/login',
      '/api/logout',
      '/api/refresh-token',
      '/api/csrf-token',
      '/api/summarize',
    ]);
    if (openPaths.has(req.path)) return next();
    return csrfProtection(req, res, next);
  });
} else {
  // In test environment, do not use csurf at all to simplify automated requests
}

// Rate limit authentication endpoints to mitigate brute force
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests, please try again later.' }
});
app.use(['/api/login', '/api/refresh-token'], authLimiter);

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

// Multer setup for PDF uploads — switch to disk storage with randomized safe filenames
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
      cb(null, safe);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB cap
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf';
    if (!isPdf) return cb(new Error('Only PDF files are allowed'));
    return cb(null, true);
  },
});

// Simple always-on health endpoint (non-namespaced)
app.get('/health', (_req, res) => res.json({ ok: true }));

// Namespaced API health (kept for compatibility)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Dev-only ping endpoint (authenticated) — useful for quick DevTools checks
if (!isProd) {
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

// --- Auth: refresh token (accept a valid token and reissue) ---
app.post('/api/refresh-token', (req, res) => {
  const auth = req.headers['authorization'] || '';
  const oldToken = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!oldToken) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(oldToken, JWT_SECRET);
    const { sub, role } = payload || {};
    const token = jwt.sign({ sub, role }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ success: true, token });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// --- Profile (protected) --- normalized shape { success, profile }
app.get('/api/profile', requireAuth, (req, res) => {
  const { sub, role } = req.user || {};
  return res.json({ success: true, profile: { username: sub, role: role || 'user' } });
});

// --- Current user metadata (used by Next.js / toolbar gating) ---
// Returns minimal identity info; in a real deployment you might enrich this from a user store.
app.get('/api/me', (req, res) => {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  let email = null;
  let staff = false;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) || {};
      // We only store username in token; treat it as email if it contains '@'
      email = (payload.sub && String(payload.sub).includes('@')) ? payload.sub : null;
      const staffList = (process.env.TOOLBAR_STAFF_EMAILS || '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
      staff = !!(email && staffList.includes(String(email).toLowerCase()));
    } catch {
      // ignore invalid token
    }
  }
  return res.json({ email, staff });
});

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

// Toolbar injection middleware (legacy HTML pages only)
// Injects the Vercel toolbar script for staff users when enabled. Matches simple HTML responses.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (!process.env.VERCEL_TOOLBAR_ENABLED || process.env.VERCEL_TOOLBAR_ENABLED !== 'true') return next();
  // Only operate on legacy/static HTML under /legacy or root redirect target
  if (!req.path.endsWith('.html') && req.path !== '/' && !req.path.startsWith('/legacy')) return next();

  // Monkey-patch res.send to inject before </head>
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    try {
      if (typeof body === 'string' && body.includes('</head>')) {
        // Determine staff via token (re-run small logic)
        let isStaff = false;
        const auth = req.headers['authorization'] || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
        if (token) {
          try {
            const payload = jwt.verify(token, JWT_SECRET) || {};
            const maybeEmail = (payload.sub && String(payload.sub).includes('@')) ? payload.sub : null;
            if (maybeEmail) {
              const staffList = (process.env.TOOLBAR_STAFF_EMAILS || '')
                .split(',')
                .map(s => s.trim().toLowerCase())
                .filter(Boolean);
              isStaff = staffList.includes(String(maybeEmail).toLowerCase());
            }
          } catch { /* ignore */ }
        }
        if (isStaff) {
          const scriptTag = '\n<script src="https://vercel.com/toolbar/script.js" defer></script>\n';
          body = body.replace('</head>', scriptTag + '</head>');
        }
      }
    } catch { /* ignore injection errors */ }
    return originalSend(body);
  };
  return next();
});

// Global error handler (normalize Multer/file errors to 400)
 
app.use((err, _req, res, _next) => {
  // Emit full stack to test output to help debugging
  if (err && err.stack) console.error(err.stack);
  const message = err && (err.message || err.toString());
  if (message && (message.includes("Only PDF files are allowed") || message.includes("File too large") || err.name === 'MulterError')) {
    return res.status(400).json({ error: message });
  }
  return res.status(500).json({ error: message || "Internal Server Error" });
});

// If run directly, start listening; when imported (tests), export app only
if (require.main === module) {
  // Try to use project logger if available; fall back to console in minimal/container builds
  let logger;
  try {
    ({ logger } = require(path.join(__dirname, '..', 'backend', 'utils', 'logger.cjs')));
  } catch (e) {
    const c = console;
    logger = {
      info: (...args) => c.log('[info]', ...args),
      warn: (...args) => c.warn('[warn]', ...args),
      error: (...args) => c.error('[error]', ...args),
    };
  }
  app.listen(PORT, () => {
    logger.info(`Justice server listening on port ${PORT}`);
  });
}

module.exports = app;
