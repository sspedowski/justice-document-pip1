const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');

// Try to import OpenAI, fallback if not available
let OpenAI;
try {
  OpenAI = require('openai').OpenAI;
} catch (error) {
  console.log('OpenAI module not available, AI summarization disabled');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI if available
let openai;
if (OpenAI && process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Also create public/uploads for additional file storage if needed
const publicUploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${cleanName}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit (increased from 10MB)
});

// Smart categorization function
function categorizeDocument(fileName, content) {
  const text = (fileName + ' ' + content).toLowerCase();
  
  if (/medical|health|doctor|hospital|therapy|psychiatric|diagnosis|medication|treatment/i.test(text)) {
    return 'Medical';
  }
  if (/school|education|iep|grades|teacher|principal|classroom|academic|special.?education/i.test(text)) {
    return 'School';
  }
  if (/court|legal|police|case|judge|attorney|lawyer|custody|hearing|order/i.test(text)) {
    return 'Legal';
  }
  return 'General';
}

// Child detection function
function detectChild(fileName, content) {
  const text = (fileName + ' ' + content).toLowerCase();
  const hasJace = /jace/i.test(text);
  const hasJosh = /josh/i.test(text);
  
  if (hasJace && hasJosh) return 'Both';
  if (hasJace) return 'Jace';
  if (hasJosh) return 'Josh';
  return 'Unknown';
}

// Misconduct type detection
function detectMisconduct(fileName, content) {
  const text = (fileName + ' ' + content).toLowerCase();
  
  if (/physical.?abuse|hitting|violence|injury/i.test(text)) return 'Physical Abuse';
  if (/emotional.?abuse|psychological|threatening/i.test(text)) return 'Emotional Abuse';
  if (/neglect|failure.?to|inadequate/i.test(text)) return 'Neglect';
  if (/educational.?neglect|school.?failure/i.test(text)) return 'Educational Neglect';
  if (/medical.?neglect|healthcare/i.test(text)) return 'Medical Neglect';
  if (/supervision|monitoring/i.test(text)) return 'Inappropriate Supervision';
  if (/failure.?to.?protect/i.test(text)) return 'Failure to Protect';
  if (/substance|drug|alcohol/i.test(text)) return 'Substance Abuse';
  if (/domestic.?violence/i.test(text)) return 'Domestic Violence';
  
  return 'Other/Multiple';
}

// OCR fallback function - only works with image files, not PDFs
async function performOCR(filePath) {
  let worker;
  try {
    // Check if file is an image format that Tesseract can handle
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif'];
    const fileExtension = path.extname(filePath).toLowerCase();
    
    if (!supportedExtensions.includes(fileExtension)) {
      console.log('OCR skipped: File format not supported by Tesseract:', fileExtension);
      return '';
    }

    console.log('Attempting OCR on supported image format:', filePath);
    worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(filePath);
    console.log('OCR completed, extracted text length:', text.length);
    return text || '';
  } catch (error) {
    console.error('OCR failed:', error.message);
    return '';
  } finally {
    // Always terminate the worker to prevent memory leaks
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.error('Error terminating OCR worker:', terminateError.message);
      }
    }
  }
}

// OpenAI summarization function
async function generateSummary(text, fileName) {
  if (!openai) {
    return `Document: ${fileName}. AI summarization unavailable (no API key or module).`;
  }

  try {
    const prompt = `Summarize this legal document in 2-3 sentences, focusing on key facts, dates, and legal issues: ${text.substring(0, 3000)}`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.3
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return `Document: ${fileName}. Content extracted but AI summary failed.`;
  }
}

// Main upload and processing endpoint
app.post('/api/summarize', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing file:', req.file.originalname);
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    
    // Generate file URL for frontend access
    const fileURL = `http://localhost:${PORT}/uploads/${req.file.filename}`;

    let textContent = '';

    try {
      // Attempt PDF text extraction
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      textContent = pdfData.text;
      console.log('PDF text extracted, length:', textContent.length);
      
      // If extracted text is too short, try OCR
      if (textContent.length < 100) {
        console.log('Text too short, attempting OCR fallback...');
        const ocrText = await performOCR(filePath);
        if (ocrText.length > textContent.length) {
          textContent = ocrText;
          console.log('OCR provided better results');
        }
      }
    } catch (pdfError) {
      console.log('PDF extraction failed, using OCR fallback:', pdfError.message);
      textContent = await performOCR(filePath);
    }

    // Smart categorization and detection
    const category = categorizeDocument(fileName, textContent);
    const child = detectChild(fileName, textContent);
    const misconduct = detectMisconduct(fileName, textContent);

    // Generate AI summary
    const summary = await generateSummary(textContent, fileName);

    // Response object
    const result = {
      fileName,
      fileURL,
      category,
      child,
      misconduct,
      summary,
      textLength: textContent.length,
      processed: new Date().toISOString()
    };

    console.log('Processing complete:', {
      fileName,
      category,
      child,
      misconduct,
      textLength: textContent.length
    });

    res.json(result);

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'File processing failed: ' + error.message });
  }
});

// Consolidated PDF processing function
async function summarizePdf(file) {
  const filePath = file.path;
  const fileName = file.originalname;
  
  console.log('Processing file for v2 client:', fileName);
  
  let textContent = '';

  try {
    // Attempt PDF text extraction
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    textContent = pdfData.text;
    console.log('PDF text extracted, length:', textContent.length);
  } catch (pdfError) {
    console.log('PDF extraction failed:', pdfError.message);
    textContent = fileName; // Fallback to filename
  }

  // Ensure we have some content to work with
  if (!textContent || textContent.trim().length === 0) {
    textContent = fileName;
  }

  // Smart categorization and detection
  const category = categorizeDocument(fileName, textContent);
  const child = detectChild(fileName, textContent);
  const misconduct = detectMisconduct(fileName, textContent);

  // Generate AI summary (with error handling)
  let summary;
  try {
    if (openai && process.env.OPENAI_API_KEY) {
      summary = await generateSummary(textContent, fileName);
    } else {
      summary = `Document: ${fileName}. Content extracted (${textContent.length} characters). AI summarization disabled.`;
    }
  } catch (summaryError) {
    console.log('AI summary failed:', summaryError.message);
    summary = `Document: ${fileName}. Content processed but AI summary unavailable.`;
  }

  return {
    summary: summary || `Document: ${fileName}`,
    category: category || 'General',
    child: child || 'Unknown',
    misconduct: misconduct || 'Other/Multiple'
  };
}

// New simplified upload endpoint for v2 client
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "no file received" });
    }

    // --- your existing PDF parsing / OpenAI summarisation -------
    const { summary, category, child, misconduct } = await summarizePdf(req.file);
    // ------------------------------------------------------------

    return res.json({ summary, category, child, misconduct });
  } catch (err) {
    console.error("Upload failed:", err);

    // Multer size limit
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "file too large" });
    }

    return res.status(500).json({ error: err.message || "server error" });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    openaiConfigured: !!openai
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Justice Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload endpoint (v2): http://localhost:${PORT}/upload`);
  console.log(`📁 Upload endpoint (v1): http://localhost:${PORT}/api/summarize`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 OpenAI configured: ${!!openai}`);
});

module.exports = app;