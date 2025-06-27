const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { fromPath } = require("pdf2pic");
const Tesseract = require("tesseract.js");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.static(__dirname)); // Serve static files from root directory
app.use("/files", express.static(path.join(__dirname, "public")));

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
    const isJunk = cleanText.length < 100 || /%PDF|obj|stream|endobj/i.test(cleanText);

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
      summary: ocrText.trim().substring(0, 500) || "OCR failed to extract text.",
      fileURL: `/files/${sanitized}`,
      fileName: originalName,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Failed to summarize file." });
  }
});

// AI analysis endpoint
app.post("/api/ai-analyze", express.json(), async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // For now, use the fallback logic since we don't have a real AI service configured
    // You can replace this with actual AI service calls (OpenAI, Anthropic, etc.)
    const result = detectMisconductFallback(prompt);
    
    res.json({ 
      result: result,
      status: "success",
      method: "fallback_logic"
    });
    
  } catch (error) {
    console.error("AI analysis error:", error);
    res.status(500).json({ 
      error: "AI analysis failed",
      result: "Review Needed"
    });
  }
});

// Fallback misconduct detection function for server
function detectMisconductFallback(text) {
  const lowerText = text.toLowerCase();
  
  // CPS misconduct (check first - most specific)
  if (/\bcps\b|child protective services|dcfs|dhs.*child|child.*investigation|family.*investigation|case.*worker|social.*worker.*child/.test(lowerText)) {
    return "CPS/Social Services Misconduct";
  }
  
  // Educational rights (specific school issues)
  if (/\biep\b|\b504\b|special education|school.*disci|expul|suspen|educational.*rights|school.*denial/.test(lowerText)) {
    return "Educational Rights Violation";
  }
  
  // Law enforcement (specific police/arrest issues)
  if (/\bpolice\b|officer.*misconduct|arrest|detention|miranda|excessive.*force|police.*report|law.*enforcement.*violation/.test(lowerText)) {
    return "Law Enforcement Misconduct";
  }
  
  // Court/judicial (specific legal process issues)
  if (/\bcourt\b.*\b(error|bias|misconduct)\b|judge.*bias|judicial.*misconduct|legal.*proceedings.*flawed|hearing.*denied/.test(lowerText)) {
    return "Judicial/Court Process Violation";
  }
  
  // Custody issues (specific custody/visitation problems)
  if (/custody.*denied|visitation.*denied|parenting.*time.*blocked|access.*child.*denied|custody.*interference/.test(lowerText)) {
    return "Custody/Visitation Rights Violation";
  }
  
  // Medical/HIPAA violations (more specific medical privacy issues)
  if (/hipaa.*violation|medical.*records.*disclosed|health.*information.*shared|medical.*privacy.*breach|unauthorized.*medical/.test(lowerText)) {
    return "Denial of Right to Medical Safety and Privacy (HIPAA Violations)";
  }
  
  // Due process violations (broader constitutional issues)
  if (/due.*process|fourteenth.*amendment|equal.*protection|constitutional.*violation|rights.*violated|discrimination/.test(lowerText)) {
    return "Violation of the Fourteenth Amendment - Due Process and Equal Protection";
  }
  
  // General medical (less specific, fallback for medical content)
  if (/doctor|hospital|medical.*treatment|health.*care|medical.*appointment/.test(lowerText)) {
    return "Denial of Right to Medical Safety and Privacy (HIPAA Violations)";
  }
  
  return "Review Needed";
}

app.listen(3000, () => {
  console.log("✅ Justice server running at http://localhost:3000");
});
