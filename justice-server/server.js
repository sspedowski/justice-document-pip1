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
app.use(helmet()); // Apply all default protections
app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files (from Vite build)
app.use("/files", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

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

  if (!process.env.JWT_SECRET) {
    console.error("\u274c CRITICAL: Missing JWT_SECRET. Set it in your environment.");
    process.exit(1);
  }

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });
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


import chalk from 'chalk';

app.post('/api/summarize', upload.single('file'), async (req, res) => {
  console.log(chalk.cyan('📂 Received file upload to /api/summarize'));

  // --- Environment Check ---
  if (!process.env.OPENAI_API_KEY) {
    console.error(chalk.red('❌ OPENAI_API_KEY missing in environment'));
    return res.status(500).json({ error: 'Server missing OpenAI API key' });
  }

  // --- File Check ---
  if (!req.file) {
    console.error(chalk.red('❌ No file uploaded'));
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // --- Parse PDF ---
    console.log(chalk.blue('📄 Parsing PDF...'));
    const dataBuffer = req.file.buffer;
    const pdfData = await pdfParse(dataBuffer);
    let extractedText = pdfData.text.trim();
    console.log(chalk.green(`✅ PDF parsed, extracted length: ${extractedText.length}`));

    // --- OCR Fallback ---
    if (!extractedText) {
      console.warn(chalk.yellow('⚠️ PDF text empty — running OCR fallback...'));
      try {
        const options = {
          density: 100,
          saveFilename: 'ocr',
          savePath: './temp',
          format: 'png',
          width: 600,
          height: 800
        };
        const storeAsImage = fromPath(req.file.path || './tempfile.pdf', options);
        const image = await storeAsImage(1);
        const ocrResult = await Tesseract.recognize(image.path, 'eng');
        extractedText = ocrResult.data.text;
        console.log(chalk.green(`✅ OCR extracted text length: ${extractedText.length}`));
      } catch (ocrError) {
        console.error(chalk.red('❌ OCR fallback failed:'), ocrError);
        return res.status(500).json({ error: 'OCR fallback failed', details: ocrError.message });
      }
    }

    // --- OpenAI Summarization ---
    console.log(chalk.blue('🧠 Sending text to OpenAI for summarization...'));
    const summaryPrompt = `Summarize the following legal document:\n\n${extractedText}`;
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: summaryPrompt }]
      })
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error(chalk.red('❌ OpenAI API request failed:'), errText);
      return res.status(500).json({ error: 'OpenAI API request failed', details: errText });
    }

    const openaiData = await openaiResponse.json();
    const summary = openaiData.choices?.[0]?.message?.content || 'No summary generated';
    console.log(chalk.green('✅ Summary generated successfully'));

    res.json({ summary });

  } catch (err) {
    console.error(chalk.red('❌ Unexpected error in /api/summarize:'), err);
    res.status(500).json({ error: 'Unexpected error', details: err.message });
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
