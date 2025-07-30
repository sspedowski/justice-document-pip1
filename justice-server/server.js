// ==========================
// Justice Dashboard Server
// Render Production Build
// ==========================

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { fromPath } = require("pdf2pic");
const Tesseract = require("tesseract.js");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

// ==========================
// Load Environment Variables
// ==========================
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(process.cwd(), 'justice-server', '.env'),
  path.join(__dirname, '..', 'justice-server', '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    console.log(`📄 Loaded environment from: ${envPath}`);
    envLoaded = true;
    break;
  }
}
if (!envLoaded) {
  console.warn('⚠️  No .env file found. Using Render environment variables...');
}

// ==========================
// Security Checks
// ==========================
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.error("❌ CRITICAL: Missing admin credentials.");
    process.exit(1);
  }
  if (process.env.ADMIN_PASSWORD.length < 8) {
    console.error("❌ CRITICAL: Insecure admin password. Use 8+ characters.");
    process.exit(1);
  }
}

// ==========================
// Express App Setup
// ==========================
const app = express();
const upload = multer({ dest: "uploads/" });

// Security & Middleware
app.use(helmet()); // Default helmet protections
app.use(cors());
app.use(bodyParser.json());
app.use("/files", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend

// ==========================
// Health & Status
// ==========================
app.get("/api/health", (req, res) => {
  res.json({ status: "UP", message: "Justice Dashboard backend is running." });
});

app.get("/", (req, res) => {
  res.json({
    message: "✅ Justice Dashboard Backend is Running",
    status: "active",
    endpoints: {
      health: "/api/health",
      login: "/api/login",
      logout: "/api/logout",
      upload_v1: "/api/summarize",
      upload_v2: "/upload"
    }
  });
});

// ==========================
// Authentication
// ==========================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });
    return res.status(200).json({ success: true, token, user: username });
  } else {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

app.post("/api/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// ==========================
// File Upload & Summarization
// ==========================
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const originalName = req.file.originalname;
  const sanitized = originalName.replace(/[^a-z0-9.\-]/gi, "_");
  const finalPath = path.join(__dirname, "public", sanitized);

  try {
    fs.renameSync(req.file.path, finalPath);
    res.json({
      success: true,
      message: "File uploaded successfully",
      fileURL: `/files/${sanitized}`,
      fileName: originalName
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload file." });
  }
});

app.post("/api/summarize", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  const originalName = req.file.originalname;
  const sanitized = originalName.replace(/[^a-z0-9.\-]/gi, "_");
  const finalPath = path.join(__dirname, "public", sanitized);

  try {
    fs.renameSync(req.file.path, finalPath);
    const parsed = await pdfParse(fs.readFileSync(finalPath));
    const cleanText = parsed.text.trim();
    const wordCount = (cleanText.match(/[a-zA-Z]{3,}/g) || []).length;

    if (wordCount > 5 && cleanText.length >= 100) {
      return res.json({ summary: cleanText.substring(0, 500), fileURL: `/files/${sanitized}` });
    }

    const convert = fromPath(finalPath, { density: 200, format: "png", width: 1200, height: 1600 });
    const image = await convert(1, true);
    const ocrResult = await Tesseract.recognize(image.path, "eng");

    res.json({ summary: ocrResult.data.text.trim().substring(0, 500) || "OCR failed.", fileURL: `/files/${sanitized}` });
  } catch (error) {
    res.status(500).json({ error: "Failed to summarize file." });
  }
});

// ==========================
// SPA Catch-All (Express 5 Compatible)
// ==========================
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Justice Dashboard server running on ${HOST}:${PORT}`);
  console.log(`🏥 Health check: http://${HOST}:${PORT}/api/health`);
  console.log("🔑 Environment status:", {
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
    SESSION_SECRET: process.env.SESSION_SECRET ? "✅ Set" : "❌ Missing",
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || "❌ Missing"
  });
});
