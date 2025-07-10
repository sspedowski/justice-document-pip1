/**
 * Cloud Functions for Justice Dashboard
 * 
 * This file contains Firebase Cloud Functions for document processing,
 * legal analysis, and AI-powered summarization.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const logger = require('firebase-functions/logger');

// Third-party libraries
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const axios = require('axios');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const storage = getStorage();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze uploaded document
 * Extracts text, identifies legal statutes, and generates summary
 */
exports.analyzeDocument = onCall(async (request) => {
  try {
    const { documentUrl, options = {} } = request.data;
    
    if (!documentUrl) {
      throw new HttpsError('invalid-argument', 'Document URL is required');
    }
    
    logger.info('Starting document analysis', { documentUrl, options });
    
    // Download document from Storage
    const response = await axios.get(documentUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Extract text from PDF
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;
    
    // Identify legal statutes
    const legalStatutes = await extractLegalStatutes(extractedText);
    
    // Generate AI summary
    const summary = await generateAISummary(extractedText, options.documentType || 'legal');
    
    // Determine document category and child classification
    const classification = await classifyDocument(extractedText);
    
    const analysis = {
      originalText: extractedText,
      summary,
      legalStatutes,
      classification,
      wordCount: extractedText.split(' ').length,
      pageCount: pdfData.numpages,
      processedAt: new Date(),
      documentUrl
    };
    
    logger.info('Document analysis completed', { 
      wordCount: analysis.wordCount,
      statutesFound: legalStatutes.length 
    });
    
    return analysis;
    
  } catch (error) {
    logger.error('Error analyzing document', error);
    throw new HttpsError('internal', 'Failed to analyze document');
  }
});

/**
 * Extract legal statutes from text
 */
exports.extractLegalStatutes = onCall(async (request) => {
  try {
    const { text } = request.data;
    
    if (!text) {
      throw new HttpsError('invalid-argument', 'Text is required');
    }
    
    const statutes = await extractLegalStatutes(text);
    return { statutes };
    
  } catch (error) {
    logger.error('Error extracting legal statutes', error);
    throw new HttpsError('internal', 'Failed to extract legal statutes');
  }
});

/**
 * Generate AI-powered summary
 */
exports.generateSummary = onCall(async (request) => {
  try {
    const { text, documentType = 'legal' } = request.data;
    
    if (!text) {
      throw new HttpsError('invalid-argument', 'Text is required');
    }
    
    const summary = await generateAISummary(text, documentType);
    return { summary };
    
  } catch (error) {
    logger.error('Error generating summary', error);
    throw new HttpsError('internal', 'Failed to generate summary');
  }
});

/**
 * Triggered when a new document is uploaded to analyze
 */
exports.onDocumentUpload = onDocumentCreated('document_analysis/{docId}', async (event) => {
  try {
    const docData = event.data.data();
    
    if (docData.documentUrl && !docData.processed) {
      logger.info('Auto-processing uploaded document', { docId: event.params.docId });
      
      // Analyze the document
      const analysis = await analyzeDocument(docData.documentUrl);
      
      // Update the document with analysis results
      await event.data.ref.update({
        ...analysis,
        processed: true,
        processedAt: new Date()
      });
      
      logger.info('Document auto-processing completed', { docId: event.params.docId });
    }
  } catch (error) {
    logger.error('Error in document upload trigger', error);
  }
});

// Helper Functions

/**
 * Extract legal statutes from text using pattern matching and AI
 */
async function extractLegalStatutes(text) {
  const statutes = [];
  const lowerText = text.toLowerCase();
  
  // Constitutional Violations
  if (lowerText.includes('due process') || lowerText.includes('14th amendment')) {
    statutes.push('14th Amendment – Due Process');
  }
  if (lowerText.includes('1st amendment') || lowerText.includes('free speech')) {
    statutes.push('1st Amendment – Free Speech');
  }
  if (lowerText.includes('search warrant') || lowerText.includes('4th amendment')) {
    statutes.push('4th Amendment – Search and Seizure');
  }
  
  // Federal Statutes
  if (lowerText.includes('brady v. maryland') || lowerText.includes('exculpatory') || lowerText.includes('suppressed evidence')) {
    statutes.push('Brady v. Maryland – Suppression of Evidence');
  }
  if (lowerText.includes('42 u.s.c. § 1983') || lowerText.includes('civil rights') || lowerText.includes('color of law')) {
    statutes.push('42 U.S.C. § 1983 – Civil Rights Violation');
  }
  
  // Michigan MCL Violations
  if (lowerText.includes('722.628') || lowerText.includes('cps duty') || lowerText.includes('failure to investigate')) {
    statutes.push('MCL 722.628 – CPS Duty to Investigate');
  }
  if (lowerText.includes('722.623') || lowerText.includes('mandatory report') || lowerText.includes('reporting requirements')) {
    statutes.push('MCL 722.623 – Mandatory Reporting');
  }
  if (lowerText.includes('764.15c') || lowerText.includes('retaliation') || lowerText.includes('illegal retaliation')) {
    statutes.push('MCL 764.15c – Illegal Retaliation');
  }
  if (lowerText.includes('600.1701') || lowerText.includes('contempt') || lowerText.includes('court misconduct')) {
    statutes.push('MCL 600.1701 – Court Contempt Authority');
  }
  
  // Use OpenAI to identify additional legal references
  try {
    const aiStatutes = await identifyLegalReferencesWithAI(text);
    statutes.push(...aiStatutes);
  } catch (error) {
    logger.warn('AI statute extraction failed', error);
  }
  
  return [...new Set(statutes)]; // Remove duplicates
}

/**
 * Generate AI-powered summary using OpenAI
 */
async function generateAISummary(text, documentType = 'legal') {
  try {
    const prompt = `Analyze this ${documentType} document and provide a comprehensive summary focusing on:
1. Key legal issues and violations
2. Parties involved
3. Timeline of events
4. Evidence presented
5. Legal significance

Document text:
${text.substring(0, 8000)}...`; // Limit to avoid token limits
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a legal expert analyzing documents for potential misconduct, constitutional violations, and due process issues. Focus on Michigan law (MCL) and federal constitutional rights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });
    
    return completion.choices[0].message.content;
    
  } catch (error) {
    logger.error('Error generating AI summary', error);
    return `Document: ${text.substring(0, 200)}... [AI summary unavailable]`;
  }
}

/**
 * Classify document type and child involvement
 */
async function classifyDocument(text) {
  const lowerText = text.toLowerCase();
  
  let category = 'General Legal';
  let child = 'Unknown';
  let misconduct = 'Unspecified';
  
  // Determine category
  if (lowerText.includes('court') || lowerText.includes('hearing') || lowerText.includes('judge')) {
    category = 'Court Documents';
  } else if (lowerText.includes('cps') || lowerText.includes('child protective')) {
    category = 'CPS Records';
  } else if (lowerText.includes('medical') || lowerText.includes('health')) {
    category = 'Medical Records';
  } else if (lowerText.includes('evidence') || lowerText.includes('exhibit')) {
    category = 'Legal Evidence';
  }
  
  // Determine child (this would be customized based on your case)
  if (lowerText.includes('specific child name')) {
    child = 'Child Name';
  }
  
  // Determine misconduct type
  if (lowerText.includes('due process') || lowerText.includes('constitutional')) {
    misconduct = 'Constitutional Violation';
  } else if (lowerText.includes('brady') || lowerText.includes('evidence suppression')) {
    misconduct = 'Evidence Suppression';
  } else if (lowerText.includes('retaliation')) {
    misconduct = 'Illegal Retaliation';
  } else if (lowerText.includes('contempt') || lowerText.includes('court misconduct')) {
    misconduct = 'Judicial Misconduct';
  }
  
  return { category, child, misconduct };
}

/**
 * Use AI to identify additional legal references
 */
async function identifyLegalReferencesWithAI(text) {
  try {
    const prompt = `Identify all legal statutes, codes, case law, and constitutional references mentioned in this text. Return them in a JSON array format:

${text.substring(0, 4000)}...`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a legal research assistant. Extract all legal references from documents and return them as a clean JSON array of strings."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });
    
    const response = completion.choices[0].message.content;
    try {
      return JSON.parse(response);
    } catch {
      return [];
    }
    
  } catch (error) {
    logger.warn('AI legal reference extraction failed', error);
    return [];
  }
}
