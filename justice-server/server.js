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
require("dotenv").config({ path: path.join(__dirname, '.env') });

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

  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "adminpass";

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

app.listen(3000, () => {
  console.log("✅ Justice server running at http://localhost:3000");
  console.log("📁 Upload endpoint (v2): http://localhost:3000/upload");
  console.log("📁 Upload endpoint (v1): http://localhost:3000/api/summarize");
  console.log("🔑 Environment variables loaded:", {
    JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing",
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  });
});
