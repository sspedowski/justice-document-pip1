/* Justice Dashboard - Simplified Version for Bulk Processing */

// Global variables
let isProcessingBulk = false;
let bulkProgress = 0;
let bulkTotal = 0;

// DOM Elements (initialized on page load)
let fileInput, generateBtn, bulkProcessBtn, updateExistingBtn, exportBtn, summaryBox, trackerBody;
let categoryFilter, misconductFilter, totalCasesEl, activeCasesEl;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Justice Dashboard...');
  
  // Get DOM elements
  fileInput = document.getElementById("fileInput");
  generateBtn = document.getElementById("generateBtn");
  bulkProcessBtn = document.getElementById("bulkProcessBtn");
  updateExistingBtn = document.getElementById("updateExistingBtn");
  exportBtn = document.getElementById("exportBtn");
  summaryBox = document.getElementById("summaryBox");
  trackerBody = document.querySelector("#results");
  categoryFilter = document.getElementById('categoryFilter');
  misconductFilter = document.getElementById('misconductFilter');
  totalCasesEl = document.getElementById('totalCases');
  activeCasesEl = document.getElementById('activeCases');

  // Check if essential elements exist
  if (!fileInput || !generateBtn || !trackerBody) {
    console.error('Required DOM elements not found:', {
      fileInput: !!fileInput,
      generateBtn: !!generateBtn,
      trackerBody: !!trackerBody
    });
    return;
  }

  console.log('All elements found, setting up event handlers...');
  
  // Set up event handlers
  setupEventHandlers();
  
  // Restore saved data
  restoreData();
  
  console.log('Justice Dashboard initialized successfully!');
});

// Set up all event handlers
function setupEventHandlers() {
  // Main process button
  generateBtn.onclick = async () => {
    const files = fileInput?.files;
    
    if (!files?.length) {
      alert("Please select PDF files first.");
      return;
    }
    
    if (files.length > 1) {
      const proceed = confirm(
        `You've selected ${files.length} files.\\n\\n` +
        `Process all files? This may take a while.`
      );
      
      if (proceed) {
        await processBulkFiles(Array.from(files), false);
      }
    } else {
      // Process single file
      await processSingleFile(files[0]);
    }
  };

  // Bulk process button
  if (bulkProcessBtn) {
    bulkProcessBtn.onclick = async () => {
      const files = fileInput?.files;
      
      if (!files?.length) {
        alert("Please select PDF files first.");
        return;
      }
      
      const proceed = confirm(
        `Bulk process ${files.length} files?\\n\\n` +
        `• Duplicates will be automatically skipped\\n` +
        `• Processing may take several minutes\\n` +
        `• Don't close the browser while processing`
      );
      
      if (proceed) {
        await processBulkFiles(Array.from(files), true);
      }
    };
  }

  // Export button
  if (exportBtn) {
    exportBtn.onclick = exportToCSV;
  }

  // Update existing entries button
  if (updateExistingBtn) {
    updateExistingBtn.onclick = () => {
      try {
        smartUpdateRows();
      } catch (error) {
        console.error('Error updating existing rows:', error);
        alert('Error updating entries. Please try again.');
      }
    };
  }
}

// Process a single file
async function processSingleFile(file) {
  try {
    const text = await pdfToText(file);
    const summary = quickSummary(text);
    const fileURL = URL.createObjectURL(file);
    
    if (summaryBox) {
      summaryBox.textContent = summary;
    }
    
    // Check for duplicates
    const dupeCheck = isDuplicate(file.name, summary);
    if (dupeCheck.isDupe) {
      const userConfirm = confirm(
        `⚠️ Potential duplicate detected!\\n\\n` +
        `Reason: ${dupeCheck.reason}\\n\\n` +
        `Do you want to add this document anyway?`
      );
      
      if (!userConfirm) {
        alert("Document not added - duplicate detected.");
        return;
      }
    }
    
    addRow({
      category: detectCategoryFromPath(text, file.name, file.webkitRelativePath || file.name),
      child: detectChild(text),
      misconduct: "Review Needed",
      summary,
      tags: keywordTags(text),
      fileURL,
      fileName: parseFileName(file.name)
    });
    
    alert("Document processed successfully!");
    
  } catch (error) {
    console.error('Error processing file:', error);
    alert(`Error processing ${file.name}: ${error.message}`);
  }
}

// Bulk processing function
async function processBulkFiles(files, skipDuplicates = false) {
  isProcessingBulk = true;
  bulkTotal = files.length;
  bulkProgress = 0;
  
  const progressDiv = document.getElementById('bulkProgress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  if (progressDiv) progressDiv.classList.remove('hidden');
  
  let processedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    bulkProgress = i + 1;
    
    // Update progress
    const percentage = (bulkProgress / bulkTotal) * 100;
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `Processing ${bulkProgress} of ${bulkTotal} files... (${file.name})`;
    
    try {
      // Add delay to prevent browser freezing
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const text = await pdfToText(file);
      const summary = quickSummary(text);
      const fileURL = URL.createObjectURL(file);
      
      // Check for duplicates if requested
      if (skipDuplicates) {
        const dupeCheck = isDuplicate(file.name, summary);
        if (dupeCheck.isDupe) {
          duplicateCount++;
          continue;
        }
      }
      
      // Add row without alerts
      addRow({
        category: detectCategoryFromPath(text, file.name, file.webkitRelativePath || file.name),
        child: detectChild(text),
        misconduct: "Review Needed",
        summary,
        tags: keywordTags(text),
        fileURL,
        fileName: parseFileName(file.name)
      });
      
      processedCount++;
      
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      errorCount++;
    }
  }
  
  // Hide progress and show results
  if (progressDiv) progressDiv.classList.add('hidden');
  isProcessingBulk = false;
  
  alert(
    `Bulk processing complete!\\n\\n` +
    `✅ Processed: ${processedCount} files\\n` +
    `⚠️ Duplicates skipped: ${duplicateCount}\\n` +
    `❌ Errors: ${errorCount}\\n` +
    `📊 Total: ${bulkTotal} files`
  );
}

// PDF to text converter
async function pdfToText(file) {
  try {
    if (typeof pdfjsLib === 'undefined') {
      console.warn('PDF.js not loaded, using filename as text');
      return `PDF File: ${file.name}`;
    }
    
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = "";
    
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      text += content.items.map(i => i.str).join(" ") + "\\n";
    }
    return text.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    return `PDF Document: ${file.name} (content extraction failed)`;
  }
}

// Text summarizer
const quickSummary = (text) => {
  const clean = text.replace(/\\s+/g, " ").trim();
  return clean.length > 200 ? clean.slice(0, 197) + "…" : clean;
};

// Enhanced filename parsing for Google Drive files
function parseFileName(filePath) {
  // Extract just the filename from full path
  const fileName = filePath.split(/[/\\]/).pop();
  
  // Clean up common Google Drive artifacts
  const cleanName = fileName
    .replace(/^.*\d{4}\\/, '') // Remove year folders
    .replace(/\+/g, ' ') // Replace + with spaces
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
    
  return cleanName;
}

// Enhanced category detection that considers filename patterns
function detectCategoryFromPath(text, fileName, filePath) {
  const lowerText = text.toLowerCase();
  const lowerFileName = (fileName || "").toLowerCase();
  const lowerPath = (filePath || "").toLowerCase();
  
  // CPS/Legal keywords
  if (/cps complaint|court|police report|search warrant|investigation|foc|divorce|custody|hearing|notice/.test(lowerFileName) ||
      /cps|court|police|warrant|legal|custody/.test(lowerPath)) {
    return "Legal";
  }
  
  // Medical keywords
  if (/urgent care|medical|health|doctor|hospital|brains|spectrum health|eval|consult/.test(lowerFileName) ||
      /medical|health|doctor|hospital/.test(lowerPath) ||
      /medical|doctor|hospital|health|patient|treatment|diagnosis|urgent care/.test(lowerText)) {
    return "Medical";
  }
  
  // School keywords  
  if (/grades|school|education|ela|math|science|pe|health/.test(lowerFileName) ||
      /school|education|grades/.test(lowerPath) ||
      /school|education|teacher|classroom|grades/.test(lowerText)) {
    return "School";
  }
  
  return "General";
}

// Category detector
function detectCategory(text, fileName) {
  const lowerText = text.toLowerCase();
  const lowerFileName = (fileName || "").toLowerCase();
  
  // Medical keywords
  if (/medical|doctor|hospital|health|hipaa|patient|treatment|prescription|diagnosis/.test(lowerText) ||
      /medical|doctor|hospital|health/.test(lowerFileName)) {
    return "Medical";
  }
  
  // School keywords  
  if (/school|education|teacher|classroom|iep|504|special education|principal|counselor/.test(lowerText) ||
      /school|education|iep/.test(lowerFileName)) {
    return "School";
  }
  
  // Legal keywords
  if (/court|judge|attorney|lawyer|legal|custody|visitation|case|lawsuit|hearing/.test(lowerText) ||
      /court|legal|case/.test(lowerFileName)) {
    return "Legal";
  }
  
  return "General";
}

// Child name detector (enhanced)
function detectChild(text) {
  if (!text || typeof text !== 'string') {
    return "Unknown";
  }
  
  // Convert to lowercase for case-insensitive matching
  const cleanText = text.toLowerCase();
  
  // More flexible patterns to catch variations
  const jacePatterns = [
    /\bjace\b/i,           // Standard word boundary
    /jace[\s,\.]/i,        // Jace followed by space, comma, or period
    /[\s,\.]jace/i,        // Jace preceded by space, comma, or period
    /^jace[\s,\.]/i,       // Jace at start of text
    /[\s,\.]jace$/i        // Jace at end of text
  ];
  
  const joshPatterns = [
    /\bjosh\b/i,           // Standard word boundary
    /josh[\s,\.]/i,        // Josh followed by space, comma, or period
    /[\s,\.]josh/i,        // Josh preceded by space, comma, or period
    /^josh[\s,\.]/i,       // Josh at start of text
    /[\s,\.]josh$/i        // Josh at end of text
  ];
  
  const jaceFound = jacePatterns.some(pattern => pattern.test(text));
  const joshFound = joshPatterns.some(pattern => pattern.test(text));
  
  if (jaceFound && joshFound) return "Both";
  if (jaceFound) return "Jace";
  if (joshFound) return "Josh";
  return "Unknown";
}

// Legal keyword tagger
function keywordTags(text) {
  const keywords = {
    "Brady Violation": /\bbrady\b|exculpatory/i,
    "Civil Rights": /civil rights|§?1983/i,
    "CPS Negligence": /cps (?:failed|negligence)/i,
    "Custody Interference": /denied visitation|interference/i
  };
  
  return Object.entries(keywords)
    .filter(([, regex]) => regex.test(text))
    .map(([tag]) => tag);
}

// Create misconduct dropdown
function buildMisconductSelect(value = "Review Needed") {
  const select = document.createElement("select");
  const uid = `misconduct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  
  select.id = uid;
  select.name = uid;
  select.className = "bg-transparent text-sm border-0";

  const options = [
    "Review Needed",
    "Denial of Right to Medical Safety and Privacy (HIPAA Violations)",
    "Violation of the Fourteenth Amendment - Due Process and Equal Protection"
  ];

  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = option.textContent = opt;
    select.appendChild(option);
  });

  select.value = value;
  select.onchange = saveTable;
  return select;
}

// Add row to tracker
function addRow({ category, child, misconduct, summary, tags, fileURL, fileName }) {
  const row = trackerBody.insertRow();
  
  row.insertCell().innerText = category;
  row.insertCell().innerText = child;
  row.insertCell().appendChild(buildMisconductSelect(misconduct));
  
  const summaryCell = row.insertCell();
  summaryCell.textContent = summary;
  summaryCell.title = summary;
  summaryCell.className = "max-w-xs truncate";
  
  row.insertCell().innerText = tags.join(", ");
  
  const actionCell = row.insertCell();
  if (fileURL) {
    const viewBtn = document.createElement("button");
    viewBtn.className = "px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600";
    viewBtn.innerText = "View PDF";
    viewBtn.onclick = () => window.open(fileURL, '_blank');
    actionCell.appendChild(viewBtn);
  } else {
    actionCell.innerText = "N/A";
  }
  
  saveTable();
}

// Check for duplicates (optimized)
function isDuplicate(fileName, summary) {
  if (!window.summaryCache) {
    window.summaryCache = new Set();
    const existingRows = Array.from(trackerBody.querySelectorAll('tr'));
    for (const row of existingRows) {
      const cells = row.cells;
      if (cells && cells.length >= 4) {
        window.summaryCache.add(cells[3].textContent.trim());
      }
    }
  }
  
  const trimmedSummary = summary.trim();
  
  if (window.summaryCache.has(trimmedSummary)) {
    return { isDupe: true, reason: 'Identical summary content' };
  }
  
  window.summaryCache.add(trimmedSummary);
  return { isDupe: false };
}

// Save table to localStorage
function saveTable() {
  localStorage.setItem("justiceTrackerRows", trackerBody.innerHTML);
  updateDashboardStats();
}

// Update dashboard statistics
function updateDashboardStats() {
  const rows = Array.from(trackerBody.querySelectorAll('tr'));
  const totalCases = rows.length;
  const activeCases = rows.filter(row => {
    const select = row.querySelector('select');
    return select && select.value !== 'Review Needed';
  }).length;
  
  if (totalCasesEl) totalCasesEl.textContent = totalCases;
  if (activeCasesEl) activeCasesEl.textContent = activeCases;
}

// Restore saved data
function restoreData() {
  const saved = localStorage.getItem("justiceTrackerRows");
  if (saved) {
    trackerBody.innerHTML = saved;
    updateDashboardStats();
  }
}

// Export to CSV
function exportToCSV() {
  const headers = ["Category", "Child", "Misconduct", "Summary", "Tags", "Actions"];
  
  const rows = Array.from(trackerBody.querySelectorAll("tr"))
    .map(tr => Array.from(tr.children)
      .map(td => {
        const select = td.querySelector('select');
        if (select) return select.value;
        return td.innerText.replace(/\\n/g, " ").replace(/"/g, '""');
      })
      .join(","));
  
  const csv = [headers.join(","), ...rows].join("\\r\\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  
  link.href = URL.createObjectURL(blob);
  link.download = `justice_tracker_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  alert("CSV exported successfully!");
}

// Clear data function
window.clearJusticeData = function() {
  localStorage.removeItem("justiceTrackerRows");
  trackerBody.innerHTML = "";
  window.summaryCache = new Set();
  updateDashboardStats();
  console.log("Justice tracker data cleared");
};

// Update existing rows with new categorization logic
window.updateExistingRows = function() {
  const rows = Array.from(trackerBody.querySelectorAll('tr'));
  let updatedCount = 0;
  
  if (rows.length === 0) {
    alert('No existing rows to update.');
    return;
  }
  
  const proceed = confirm(
    `Update ${rows.length} existing entries with new categorization logic?\n\n` +
    `This will:\n` +
    `• Re-categorize documents (Medical, School, Legal, General)\n` +
    `• Update child detection (Jace, Josh, Both, Unknown)\n` +
    `• Keep existing summaries and misconduct selections\n\n` +
    `Continue?`
  );
  
  if (!proceed) return;
  
  rows.forEach(row => {
    try {
      const cells = row.cells;
      if (!cells || cells.length < 6) return;
      
      // Get existing data
      const summary = cells[3].textContent.trim();
      const fileName = extractFileNameFromRow(row);
      
      // Apply new detection logic
      const newCategory = detectCategoryFromPath(summary, fileName, fileName);
      const newChild = detectChild(summary + ' ' + fileName);
      
      // Update cells
      cells[0].textContent = newCategory;
      cells[1].textContent = newChild;
      
      updatedCount++;
    } catch (error) {
      console.error('Error updating row:', error);
    }
  });
  
  // Save updated data
  saveTable();
  
  alert(
    `Update complete!\n\n` +
    `✅ Updated: ${updatedCount} entries\n` +
    `🔄 New categorization applied\n` +
    `💾 Data saved automatically`
  );
};

// Helper function to extract filename from existing row
function extractFileNameFromRow(row) {
  try {
    const actionCell = row.cells[5];
    const button = actionCell.querySelector('button');
    if (button && button.textContent.includes('View PDF')) {
      // Try to get filename from any available data
      const summary = row.cells[3].textContent;
      // Look for patterns that might indicate filename
      const filePattern = /([^\\\/]+\.pdf)/i;
      const match = summary.match(filePattern);
      return match ? match[1] : 'unknown.pdf';
    }
  } catch (error) {
    console.error('Error extracting filename:', error);
  }
  return 'unknown.pdf';
}

// Batch update with better categorization based on content analysis
window.smartUpdateRows = function() {
  const rows = Array.from(trackerBody.querySelectorAll('tr'));
  
  if (rows.length === 0) {
    alert('No existing rows to update.');
    return;
  }
  
  const proceed = confirm(
    `Smart update ${rows.length} existing entries?\n\n` +
    `This will analyze the summary content to:\n` +
    `• Better categorize Medical/School/Legal/General\n` +
    `• Detect Jace/Josh mentions more accurately\n` +
    `• Update legal tags based on content\n\n` +
    `Continue?`
  );
  
  if (!proceed) return;
  
  let updatedCount = 0;
  let medicalCount = 0;
  let schoolCount = 0;
  let legalCount = 0;
  let jaceCount = 0;
  let joshCount = 0;
  let bothCount = 0;
  
  rows.forEach(row => {
    try {
      const cells = row.cells;
      if (!cells || cells.length < 6) return;
      
      const summary = cells[3].textContent.trim();
      const currentCategory = cells[0].textContent.trim();
      const fileName = extractFileNameFromRow(row);
      
      // Enhanced category detection based on content
      let newCategory = detectCategoryFromContent(summary);
      
      // Enhanced child detection - check both summary and filename
      let newChild = detectChild(summary + ' ' + fileName);
      
      // Count categories for reporting
      switch(newCategory) {
        case 'Medical': medicalCount++; break;
        case 'School': schoolCount++; break;
        case 'Legal': legalCount++; break;
      }
      
      switch(newChild) {
        case 'Jace': jaceCount++; break;
        case 'Josh': joshCount++; break;
        case 'Both': bothCount++; break;
      }
      
      // Update cells
      cells[0].textContent = newCategory;
      cells[1].textContent = newChild;
      
      // Update tags in the tags column
      const newTags = keywordTags(summary);
      cells[4].textContent = newTags.join(', ');
      
      updatedCount++;
    } catch (error) {
      console.error('Error updating row:', error);
    }
  });
  
  saveTable();
  
  alert(
    `Smart update complete!\n\n` +
    `📊 Updated: ${updatedCount} entries\n\n` +
    `📋 Categories:\n` +
    `• Medical: ${medicalCount}\n` +
    `• School: ${schoolCount}\n` +
    `• Legal: ${legalCount}\n` +
    `• General: ${updatedCount - medicalCount - schoolCount - legalCount}\n\n` +
    `👥 Children:\n` +
    `• Jace: ${jaceCount}\n` +
    `• Josh: ${joshCount}\n` +
    `• Both: ${bothCount}\n` +
    `• Unknown: ${updatedCount - jaceCount - joshCount - bothCount}`
  );
};

// Enhanced content-based category detection
function detectCategoryFromContent(content) {
  const lowerContent = content.toLowerCase();
  
  // Medical indicators (more comprehensive)
  if (/medical|health|doctor|hospital|urgent care|patient|treatment|diagnosis|prescription|hipaa|spectrum health|brains|eval|consult|injury|bruise|panic attack/.test(lowerContent)) {
    return "Medical";
  }
  
  // School indicators
  if (/school|education|grades|teacher|classroom|ela|math|science|social studies|pe|health class|principal|counselor/.test(lowerContent)) {
    return "School";
  }
  
  // Legal indicators (comprehensive)
  if (/cps|court|police|legal|attorney|lawyer|judge|hearing|warrant|investigation|custody|visitation|divorce|complaint|report|case|foc|parenti/.test(lowerContent)) {
    return "Legal";
  }
  
  return "General";
}
