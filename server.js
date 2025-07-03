const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { fromPath } = require("pdf2pic");
const Tesseract = require("tesseract.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-this";

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static(path.join(__dirname, "client")));

// In-memory user storage (replace with database in production)
const users = [
  {
    id: 1,
    username: "admin",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin"
  },
  {
    id: 2,
    username: "user",
    password: bcrypt.hashSync("user123", 10),
    role: "user"
  }
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// ============= API ROUTES =============

// Login endpoint
app.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Profile endpoint
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

// File upload configuration
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) =>
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDF files allowed"))
});

// OCR function
function ocrPdf(pdfPath) {
  return new Promise((resolve, reject) => {
    fromPath(pdfPath, { density: 200, format: "png", responseType: "image" })
      (1, { responseType: "image" })
      .then(({ path: pngPath }) =>
        Tesseract.recognize(pngPath, "eng")
          .then(({ data }) => {
            fs.unlink(pngPath, () => {}); // cleanup PNG
            resolve(data.text.trim());
          })
      )
      .catch(reject);
  });
}

// PDF summarize endpoint
app.post("/api/summarize", authenticateToken, upload.single("file"), async (req, res) => {
  const pdfPath = req.file.path;
  try {
    const { text } = await pdfParse(fs.readFileSync(pdfPath));
    let plain = text.trim();

    if (!plain) {
      console.log(`[OCR] ${req.file.originalname}`);
      plain = await ocrPdf(pdfPath);
    }
    if (!plain) plain = "[No text found]";

    res.json({
      summary: plain.slice(0, 500),
      fileName: req.file.originalname
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlink(pdfPath, () => {}); // cleanup upload
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling endpoint
app.post("/api/report-error", (req, res) => {
  console.error("Client error:", req.body);
  res.json({ success: true, message: "Error reported" });
});

// ============= FRONTEND ROUTES =============

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Justice Dashboard API running on http://localhost:${PORT}`);
  console.log(`📋 API endpoints available:`);
  console.log(`   POST /api/login`);
  console.log(`   POST /api/logout`);
  console.log(`   GET  /api/profile`);
  console.log(`   POST /api/summarize`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/report-error`);
});
