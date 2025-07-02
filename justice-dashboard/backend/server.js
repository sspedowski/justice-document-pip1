const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');

// API Configurations
const WOLFRAM_ALPHA_API_KEY = process.env.WOLFRAM_ALPHA_API_KEY;
const WOLFRAM_ALPHA_BASE_URL = 'https://api.wolframalpha.com/v2/query';

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
    apiKey: process.env.OPENAI_API_KEY,
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

// Serve frontend build files
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${cleanName}`);
  },
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (increased to prevent connection resets)
});

// Smart categorization function
function categorizeDocument(fileName, content) {
  const text = (fileName + ' ' + content).toLowerCase();

  if (
    /medical|health|doctor|hospital|therapy|psychiatric|diagnosis|medication|treatment/i.test(
      text
    )
  ) {
    return 'Medical';
  }
  if (
    /school|education|iep|grades|teacher|principal|classroom|academic|special.?education/i.test(
      text
    )
  ) {
    return 'School';
  }
  if (
    /court|legal|police|case|judge|attorney|lawyer|custody|hearing|order/i.test(
      text
    )
  ) {
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

  if (/physical.?abuse|hitting|violence|injury/i.test(text))
    return 'Physical Abuse';
  if (/emotional.?abuse|psychological|threatening/i.test(text))
    return 'Emotional Abuse';
  if (/neglect|failure.?to|inadequate/i.test(text)) return 'Neglect';
  if (/educational.?neglect|school.?failure/i.test(text))
    return 'Educational Neglect';
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
    const supportedExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.tiff',
      '.bmp',
      '.gif',
    ];
    const fileExtension = path.extname(filePath).toLowerCase();

    if (!supportedExtensions.includes(fileExtension)) {
      console.log(
        'OCR skipped: File format not supported by Tesseract:',
        fileExtension
      );
      return '';
    }

    console.log('Attempting OCR on supported image format:', filePath);
    worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(filePath);
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

// Wolfram Alpha analysis function
async function analyzeWithWolfram(query, analysisType = 'general') {
  if (!WOLFRAM_ALPHA_API_KEY) {
    return {
      success: false,
      result: 'Wolfram Alpha analysis unavailable (no API key)',
      analysisType,
    };
  }

  try {
    const response = await fetch(
      `${WOLFRAM_ALPHA_BASE_URL}?input=${encodeURIComponent(
        query
      )}&appid=${WOLFRAM_ALPHA_API_KEY}&format=plaintext&output=JSON&podtitle=Result&podtitle=Solution&podtitle=Timeline&podtitle=Statistics`
    );

    if (!response.ok) {
      throw new Error(`Wolfram Alpha API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.queryresult && data.queryresult.pods) {
      const relevantData = data.queryresult.pods
        .filter(pod => pod.title && pod.subpods && pod.subpods[0].plaintext)
        .map(pod => ({
          title: pod.title,
          content: pod.subpods[0].plaintext,
        }));

      return {
        success: true,
        result: relevantData,
        analysisType,
        query: query,
      };
    }

    return {
      success: false,
      result: 'No relevant analysis found',
      analysisType,
    };
  } catch (error) {
    console.error('Wolfram Alpha API error:', error.message);
    return {
      success: false,
      result: `Analysis failed: ${error.message}`,
      analysisType,
    };
  }
}

// Enhanced document analysis combining OpenAI and Wolfram Alpha
async function generateEnhancedAnalysis(text, fileName) {
  const results = {
    timestamp: new Date().toISOString(),
    fileName,
    analysis: {
      aiSummary: '',
      legalAnalysis: '',
      timelineAnalysis: '',
      statisticalAnalysis: '',
      keyEntities: [],
    },
    wolfram: {
      dateAnalysis: null,
      numericalAnalysis: null,
      patternAnalysis: null,
    },
    confidence: {
      overall: 0,
      aiSummary: 0,
      wolframAnalysis: 0,
    },
  };

  // OpenAI Legal Analysis
  if (openai) {
    try {
      // Main legal summary
      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Analyze this legal document and provide:
1. A brief summary (2-3 sentences)
2. Key legal issues identified
3. Important dates and timeline
4. Parties involved
5. Potential constitutional or statutory violations

Document: ${text.substring(0, 3000)}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      results.analysis.aiSummary =
        summaryResponse.choices[0].message.content.trim();
      results.confidence.aiSummary = 0.85;

      // Extract key entities
      const entityResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Extract key entities from this legal document. Return as JSON array with fields: name, type (person/organization/date/statute), relevance. Document: ${text.substring(
              0,
              2000
            )}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
      });

      try {
        results.analysis.keyEntities = JSON.parse(
          entityResponse.choices[0].message.content.trim()
        );
      } catch (parseError) {
        results.analysis.keyEntities = [
          { name: 'Entity extraction failed', type: 'error', relevance: 'low' },
        ];
      }
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      results.analysis.aiSummary = `AI analysis failed: ${error.message}`;
      results.confidence.aiSummary = 0;
    }
  }

  // Wolfram Alpha Analyses
  try {
    // Date and timeline analysis
    const dateMatches = text.match(
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi
    );
    if (dateMatches && dateMatches.length > 0) {
      const dateQuery = `timeline analysis of dates: ${dateMatches
        .slice(0, 5)
        .join(', ')}`;
      results.wolfram.dateAnalysis = await analyzeWithWolfram(
        dateQuery,
        'timeline'
      );
    }

    // Numerical data analysis
    const numbers = text.match(
      /\$[\d,]+\.?\d*|\b\d+\.?\d*\s*(days|months|years|percent|%)\b/gi
    );
    if (numbers && numbers.length > 0) {
      const numberQuery = `statistical analysis of: ${numbers
        .slice(0, 5)
        .join(', ')}`;
      results.wolfram.numericalAnalysis = await analyzeWithWolfram(
        numberQuery,
        'statistical'
      );
    }

    // Pattern analysis for legal terms
    const legalTerms = text.match(
      /\b(due process|constitutional|violation|statute|amendment|rights?|hearing|evidence|testimony)\b/gi
    );
    if (legalTerms && legalTerms.length > 0) {
      const patternQuery = `frequency analysis of legal terms: ${Array.from(
        new Set(legalTerms.map(t => t.toLowerCase()))
      ).join(', ')}`;
      results.wolfram.patternAnalysis = await analyzeWithWolfram(
        patternQuery,
        'pattern'
      );
    }

    results.confidence.wolframAnalysis = 0.75;
  } catch (error) {
    console.error('Wolfram Alpha analysis error:', error.message);
    results.confidence.wolframAnalysis = 0;
  }

  // Calculate overall confidence
  results.confidence.overall =
    (results.confidence.aiSummary + results.confidence.wolframAnalysis) / 2;

  return results;
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
      temperature: 0.3,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return `Document: ${fileName}. Content extracted but AI summary failed.`;
  }
}

// Authentication endpoint
app.post('/api/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.DASH_USER &&
    password === process.env.DASH_PASS
  ) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'bad credentials' });
});

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
      console.log(
        'PDF extraction failed, using OCR fallback:',
        pdfError.message
      );
      textContent = await performOCR(filePath);
    }

    // Smart categorization and detection
    const category = categorizeDocument(fileName, textContent);
    const child = detectChild(fileName, textContent);
    const misconduct = detectMisconduct(fileName, textContent);

    console.log('Detection results:', { category, child, misconduct });

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
      processed: new Date().toISOString(),
    };

    console.log('Processing complete:', {
      fileName,
      category,
      child,
      misconduct,
      textLength: textContent.length,
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
    misconduct: misconduct || 'Other/Multiple',
  };
}

// Ensure uploads directory exists
const uploadsDir2 = path.join(__dirname, 'public');
if (!fs.existsSync(uploadsDir2)) fs.mkdirSync(uploadsDir2, { recursive: true });

// New simplified upload endpoint for v2 client
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'no file received' });
    }

    // --- your existing PDF parsing / OpenAI summarisation -------
    const { summary, category, child, misconduct } = await summarizePdf(
      req.file
    );
    // ------------------------------------------------------------

    return res.json({ summary, category, child, misconduct });
  } catch (err) {
    console.error('Upload failed:', err);

    // Multer size limit
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'file too large' });
    }

    return res.status(500).json({ error: err.message || 'server error' });
  }
});

// Enhanced analysis endpoint with OpenAI + Wolfram Alpha integration
app.post('/api/analyze-enhanced', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Enhanced analysis for file:', req.file.originalname);
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
      console.log(
        'PDF extraction failed, using OCR fallback:',
        pdfError.message
      );
      textContent = await performOCR(filePath);
    }

    // Basic categorization (existing logic)
    const category = categorizeDocument(fileName, textContent);
    const child = detectChild(fileName, textContent);
    const misconduct = detectMisconduct(fileName, textContent);

    // Enhanced AI + Wolfram analysis
    const enhancedAnalysis = await generateEnhancedAnalysis(
      textContent,
      fileName
    );

    // Comprehensive response
    const result = {
      fileName,
      fileURL,
      basicClassification: {
        category,
        child,
        misconduct,
      },
      enhancedAnalysis,
      metadata: {
        textLength: textContent.length,
        processed: new Date().toISOString(),
        analysisVersion: '2.0',
        apiKeys: {
          openai: !!process.env.OPENAI_API_KEY,
          wolfram: !!process.env.WOLFRAM_ALPHA_API_KEY,
        },
      },
    };

    console.log('Enhanced analysis complete:', {
      fileName,
      category,
      textLength: textContent.length,
      aiConfidence: enhancedAnalysis.confidence.aiSummary,
      wolframConfidence: enhancedAnalysis.confidence.wolframAnalysis,
      overallConfidence: enhancedAnalysis.confidence.overall,
    });

    res.json(result);
  } catch (error) {
    console.error('Enhanced analysis error:', error);
    res.status(500).json({
      error: 'Enhanced analysis failed: ' + error.message,
      fallback: 'Try the basic /api/summarize endpoint',
    });
  }
});

// Quick analysis endpoint for testing API integrations
app.post('/api/test-integrations', express.json(), async (req, res) => {
  try {
    const { testQuery } = req.body;
    const query =
      testQuery ||
      'analyze legal document with 5 constitutional violations and 3 key dates';

    const results = {
      timestamp: new Date().toISOString(),
      query,
      integrations: {},
    };

    // Test OpenAI
    if (openai && process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: `Test query: ${query}` }],
          max_tokens: 100,
          temperature: 0.5,
        });
        results.integrations.openai = {
          status: 'success',
          response: openaiResponse.choices[0].message.content.trim(),
        };
      } catch (error) {
        results.integrations.openai = {
          status: 'error',
          error: error.message,
        };
      }
    } else {
      results.integrations.openai = {
        status: 'not_configured',
        message: 'OpenAI API key not found',
      };
    }

    // Test Wolfram Alpha
    if (process.env.WOLFRAM_ALPHA_API_KEY) {
      const wolframResult = await analyzeWithWolfram(query, 'test');
      results.integrations.wolfram = wolframResult;
    } else {
      results.integrations.wolfram = {
        status: 'not_configured',
        message: 'Wolfram Alpha API key not found',
      };
    }

    res.json(results);
  } catch (error) {
    console.error('Integration test error:', error);
    res.status(500).json({
      error: 'Integration test failed: ' + error.message,
    });
  }
});

// Batch Wolfram Alpha analysis endpoint (inspired by your batch file)
app.post('/api/batch-analyze', express.json(), async (req, res) => {
  try {
    const { queries, analysisType = 'legal-batch' } = req.body;

    if (!queries || !Array.isArray(queries)) {
      return res.status(400).json({
        error: 'Queries array required',
        example: {
          queries: [
            'Calculate duration between January 15, 2023 and March 20, 2023',
            'Statistical analysis of 5 violations over 6 months',
            'Timeline analysis of court dates',
          ],
        },
      });
    }

    const results = {
      timestamp: new Date().toISOString(),
      analysisType,
      totalQueries: queries.length,
      results: [],
      summary: {
        successful: 0,
        failed: 0,
        executionTime: 0,
      },
    };

    const startTime = Date.now();

    // Process each query with Wolfram Alpha
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(
        `Processing batch query ${i + 1}/${queries.length}: ${query}`
      );

      try {
        const wolframResult = await analyzeWithWolfram(query, `batch-${i + 1}`);

        // Also get OpenAI interpretation if available
        let aiInterpretation = null;
        if (openai && process.env.OPENAI_API_KEY) {
          try {
            const aiResponse = await openai.chat.completions.create({
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'user',
                  content: `Interpret this computational query in legal context: "${query}". Provide a brief explanation of its relevance to legal document analysis.`,
                },
              ],
              max_tokens: 100,
              temperature: 0.3,
            });
            aiInterpretation = aiResponse.choices[0].message.content.trim();
          } catch (aiError) {
            console.log(
              `AI interpretation failed for query ${i + 1}:`,
              aiError.message
            );
          }
        }

        results.results.push({
          queryIndex: i + 1,
          query,
          wolfram: wolframResult,
          aiInterpretation,
          status: wolframResult.success ? 'success' : 'partial',
        });

        if (wolframResult.success) {
          results.summary.successful++;
        } else {
          results.summary.failed++;
        }
      } catch (error) {
        console.error(`Batch query ${i + 1} failed:`, error.message);
        results.results.push({
          queryIndex: i + 1,
          query,
          wolfram: {
            success: false,
            result: `Processing failed: ${error.message}`,
            analysisType: 'error',
          },
          aiInterpretation: null,
          status: 'failed',
        });
        results.summary.failed++;
      }

      // Add small delay to avoid overwhelming APIs
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    results.summary.executionTime = Date.now() - startTime;

    console.log('Batch analysis complete:', {
      total: results.totalQueries,
      successful: results.summary.successful,
      failed: results.summary.failed,
      executionTime: `${results.summary.executionTime}ms`,
    });

    res.json(results);
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      error: 'Batch analysis failed: ' + error.message,
    });
  }
});

// Load and process batch file endpoint
app.post(
  '/api/load-batch-file',
  upload.single('batchFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No batch file uploaded' });
      }

      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Parse JSONL format (each line is a separate JSON object)
      const lines = fileContent.trim().split('\n');
      const queries = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const lineData = JSON.parse(lines[i]);

          // Extract query from OpenAI format or direct string
          let query;
          if (
            lineData.messages &&
            lineData.messages[0] &&
            lineData.messages[0].content
          ) {
            query = lineData.messages[0].content;
          } else if (typeof lineData === 'string') {
            query = lineData;
          } else if (lineData.query) {
            query = lineData.query;
          } else {
            console.log(`Skipping line ${i + 1}: unable to extract query`);
            continue;
          }

          queries.push(query);
        } catch (parseError) {
          console.log(`Error parsing line ${i + 1}:`, parseError.message);
          continue;
        }
      }

      if (queries.length === 0) {
        return res.status(400).json({
          error: 'No valid queries found in batch file',
          supportedFormats: [
            'JSONL with OpenAI message format',
            'JSONL with direct query strings',
            'JSONL with {query: "..."} objects',
          ],
        });
      }

      // Process the extracted queries
      const batchResult = await processQueriesBatch(queries, 'file-upload');

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        message: `Processed batch file with ${queries.length} queries`,
        extractedQueries: queries,
        results: batchResult,
      });
    } catch (error) {
      console.error('Batch file processing error:', error);
      res.status(500).json({
        error: 'Batch file processing failed: ' + error.message,
      });
    }
  }
);

// Helper function to process queries batch
async function processQueriesBatch(queries, analysisType) {
  // Use the same logic as the batch-analyze endpoint
  const requestBody = { queries, analysisType };

  // Simulate internal API call
  return new Promise(async resolve => {
    const results = {
      timestamp: new Date().toISOString(),
      analysisType,
      totalQueries: queries.length,
      results: [],
      summary: { successful: 0, failed: 0, executionTime: 0 },
    };

    const startTime = Date.now();

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        const wolframResult = await analyzeWithWolfram(query, `batch-${i + 1}`);
        results.results.push({
          queryIndex: i + 1,
          query,
          wolfram: wolframResult,
          status: wolframResult.success ? 'success' : 'partial',
        });

        if (wolframResult.success) results.summary.successful++;
        else results.summary.failed++;
      } catch (error) {
        results.results.push({
          queryIndex: i + 1,
          query,
          wolfram: {
            success: false,
            result: error.message,
            analysisType: 'error',
          },
          status: 'failed',
        });
        results.summary.failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    results.summary.executionTime = Date.now() - startTime;
    resolve(results);
  });
}

// Error reporting endpoint
app.post('/api/report-error', express.json(), async (req, res) => {
  try {
    const { errorMessage, documentId, context } = req.body;

    // Log the error for tracking
    console.error('Error Report:', {
      timestamp: new Date().toISOString(),
      errorMessage,
      documentId,
      context,
    });
    // Here you could also save to database or send notifications

    res.json({ success: true, message: 'Error reported successfully' });
  } catch (error) {
    console.error('Error handling error report:', error);
    res.status(500).json({ success: false, error: 'Failed to report error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    openaiConfigured: !!openai,
  });
});

// Global error handlers to prevent server crashes
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  // Don't exit the process - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process - keep server running
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Justice Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload endpoint (v2): http://localhost:${PORT}/upload`);
  console.log(
    `📁 Upload endpoint (v1): http://localhost:${PORT}/api/summarize`
  );
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 OpenAI configured: ${!!openai}`);
});

module.exports = app;
