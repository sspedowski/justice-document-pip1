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

// Load environment variables from the correct location
// Try multiple potential paths to ensure .env is found regardless of working directory
const envPaths = [
  path.join(__dirname, '.env'),                    // justice-server/.env (when run from justice-server/)
  path.join(process.cwd(), 'justice-server', '.env'), // ./justice-server/.env (when run from root)
  path.join(__dirname, '..', 'justice-server', '.env') // ../justice-server/.env (fallback)
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (require('fs').existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    console.log(`📄 Loaded environment from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  No .env file found. Checking for environment variables...');
}

// ✅ Security Check: Enforce production-ready admin credentials
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    console.error("❌ CRITICAL: Missing admin credentials for production deployment.");
    console.error("Set ADMIN_USERNAME and ADMIN_PASSWORD in Render environment variables.");
    process.exit(1);
  }
  if (process.env.ADMIN_PASSWORD === 'adminpass' || process.env.ADMIN_PASSWORD.length < 8) {
    console.error("❌ CRITICAL: Insecure admin password detected in production.");
    console.error("Use a strong password (8+ characters) for ADMIN_PASSWORD.");
    process.exit(1);
  }
}

const app = express();

// Unified Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "http://localhost:3000"],
      styleSrc: ["'self'", "http://localhost:3000"],
      frameSrc: ["'none'"],
      // Add other directives as needed
    },
  }),
);
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(bodyParser.json());
app.use("/files", express.static(path.join(__dirname, "public")));

// ✅ Serve frontend static files (from Vite build)
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "UP", message: "Justice Dashboard backend is running." });
});

// Friendly root route
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
    },
    frontend: "http://localhost:5174"
  });
});

// ✅ LOGIN ROUTE
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // ✅ Secure admin credentials (no insecure defaults in production)
  const adminUser = process.env.ADMIN_USERNAME || (process.env.NODE_ENV === 'production' ? null : "admin");
  const adminPass = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? null : "adminpass");

  if (!adminUser || !adminPass) {
    console.error("❌ Missing admin credentials");
    return res.status(500).json({ error: "Server configuration error" });
  }

  console.log(`🔐 Login attempt: ${username}`);

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1h",
    });
    console.log("✅ Login successful");
    return res.status(200).json({ success: true, token, user: username });
  } else {
    console.log("❌ Login failed");
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// ✅ LOGOUT ROUTE
app.post("/api/logout", (req, res) => {
  console.log("👋 Logout requested");
  res.json({ success: true, message: "Logged out successfully" });
});

// ✅ UPLOAD ROUTE (Alternative endpoint)
app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("📁 Upload endpoint (v2): /upload");
  const tempPath = req.file.path;
  const originalName = req.file.originalname;
  const sanitized = originalName.replace(/[^a-z0-9.\-]/gi, "_");
  const finalPath = path.join(__dirname, "public", sanitized);

  try {
    fs.renameSync(tempPath, finalPath);
    console.log("📥 File received:", originalName);
    console.log("📂 Saved at:", finalPath);

    res.json({
      success: true,
      message: "File uploaded successfully",
      fileURL: `/files/${sanitized}`,
      fileName: originalName,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Failed to upload file." });
  }
});

app.post("/api/summarize", upload.single("file"), async (req, res) => {
  const tempPath = req.file.path;
  const originalName = req.file.originalname;
  const sanitized = originalName.replace(/[^a-z0-9.\-]/gi, "_");
  const finalPath = path.join(__dirname, "public", sanitized);

  try {
    fs.renameSync(tempPath, finalPath);
    console.log("📥 File received:", originalName);
    console.log("📂 Saved at:", finalPath);

    const dataBuffer = fs.readFileSync(finalPath);
    console.log("🧪 Attempting to parse PDF...");

    const parsed = await pdfParse(dataBuffer);
    const cleanText = parsed.text.trim();

    const wordCount = (cleanText.match(/[a-zA-Z]{3,}/g) || []).length;
    const isJunk =
      cleanText.length < 100 || /%PDF|obj|stream|endobj/i.test(cleanText);

    if (wordCount > 5 && !isJunk) {
      console.log("✅ Clean text detected, summary returning.");
      return res.json({
        summary: cleanText.substring(0, 500),
        fileURL: `/files/${sanitized}`,
        fileName: originalName,
      });
    }

    console.log("🧪 Triggering OCR...");
    const convert = fromPath(finalPath, {
      density: 200,
      format: "png",
      width: 1200,
      height: 1600,
      savePath: "./uploads",
    });

    const image = await convert(1, true);
    const ocrResult = await Tesseract.recognize(image.path, "eng");
    const ocrText = ocrResult.data.text;
    console.log("✅ OCR complete. Summary extracted.");

    res.json({
      summary:
        ocrText.trim().substring(0, 500) || "OCR failed to extract text.",
      fileURL: `/files/${sanitized}`,
      fileName: originalName,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Failed to summarize file." });
  }
});

// ✅ SPA catch-all route (serve frontend for any non-API routes)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Justice server running at http://localhost:${PORT}`);
  console.log(`📁 Upload endpoint (v2): http://localhost:${PORT}/upload`);
  console.log(`📁 Upload endpoint (v1): http://localhost:${PORT}/api/summarize`);
  console.log("🔑 Environment variables loaded:", {
    JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing",
    SESSION_SECRET: process.env.SESSION_SECRET ? "✅ Set" : "❌ Missing",
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  });
  
  // Debug: Show environment loading status
  if (!process.env.JWT_SECRET || !process.env.OPENAI_API_KEY) {
    console.warn("⚠️  CRITICAL: Missing environment variables!");
    console.warn("📂 Current working directory:", process.cwd());
    console.warn("📂 Server file directory:", __dirname);
    console.warn("🔍 Checking .env file locations:");
    envPaths.forEach(envPath => {
      const exists = require('fs').existsSync(envPath);
      console.warn(`   ${exists ? '✅' : '❌'} ${envPath}`);
    });
  }
});
