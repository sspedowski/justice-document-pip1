/* Justice Dashboard — clientfunction downloadCSV(rows) {
  const header = ['Filename','Summary','Category','Child','Misconduct','Duplicate'];
  const body = rows.map(r => header.map(h => JSON.stringify(r[h.toLowerCase()] ?? '')).join(','));
  const csv = [header.join(','), ...body].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'tracker.csv'; a.click();
  URL.revokeObjectURL(url);
} (v2)
   ----------------------------------------------------------------------
   Features added:
   • Multi‑file upload (drag‑and‑drop or file input)
   • SHA‑256 duplicate detection client‑side
   • Tracker persisted in localStorage (key: "tracker")
   • Search bar + child filter
   • CSV export including new columns: child, category, duplicate
   ---------------------------------------------------------------------- */

// ===== 1. Utility helpers =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

async function sha256(file) {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Remove duplicates by filename (case-insensitive)
function removeDuplicates(docs) {
  const seen = new Set();
  return docs.filter(doc => {
    const key = doc.filename.toLowerCase(); // Normalize
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Legal statute tagging logic
function tagStatutes(doc) {
  const statutes = [];
  const text = (doc.content || doc.summary || doc.filename || '').toLowerCase();

  // Constitutional Violations
  if (text.includes("due process") || text.includes("14th amendment")) 
    statutes.push("14th Amendment – Due Process");
  if (text.includes("1st amendment") || text.includes("free speech")) 
    statutes.push("1st Amendment – Free Speech");
  if (text.includes("search warrant") || text.includes("4th amendment")) 
    statutes.push("4th Amendment – Search and Seizure");

  // Federal Statutes
  if (text.includes("brady v. maryland") || text.includes("exculpatory") || text.includes("suppressed evidence")) 
    statutes.push("Brady v. Maryland – Suppression of Evidence");
  if (text.includes("42 u.s.c. § 1983") || text.includes("civil rights") || text.includes("color of law")) 
    statutes.push("42 U.S.C. § 1983 – Civil Rights Violation");
  if (text.includes("capta") || text.includes("child abuse prevention") || text.includes("federal child protection")) 
    statutes.push("CAPTA – Federal Child Protection Standards");

  // Michigan MCL Violations
  if (text.includes("722.628") || text.includes("cps duty") || text.includes("failure to investigate")) 
    statutes.push("MCL 722.628 – CPS Duty to Investigate");
  if (text.includes("722.623") || text.includes("mandatory report") || text.includes("reporting requirements")) 
    statutes.push("MCL 722.623 – Mandatory Reporting");
  if (text.includes("764.15c") || text.includes("retaliation") || text.includes("illegal retaliation")) 
    statutes.push("MCL 764.15c – Illegal Retaliation");
  if (text.includes("600.1701") || text.includes("contempt") || text.includes("court misconduct")) 
    statutes.push("MCL 600.1701 – Court Contempt Authority");
  if (text.includes("712a.19b") || text.includes("termination") || text.includes("parental rights")) 
    statutes.push("MCL 712A.19b – Parental Rights Termination");
  if (text.includes("552.14") || text.includes("custody modification")) 
    statutes.push("MCL 552.14 – Custody Modification");

  // Case-Specific Detection
  if (text.includes("marsh cps") || text.includes("independent review")) 
    statutes.push("Independent Review Evidence");
  if (text.includes("psychological eval") || text.includes("trauma") || text.includes("battle creek counseling")) 
    statutes.push("Psychological Evidence");
  if (text.includes("holiday lawyer") || text.includes("legal strategy")) 
    statutes.push("Legal Strategy Evidence");
  if (text.includes("notice of hearing") || text.includes("hearing notice")) 
    statutes.push("Due Process Notice Violation");

  return statutes;
}

// Enhanced summarization with legal focus
function generateSummary(text, filename) {
  if (!text || text.length < 50) {
    return `Document: ${filename}. Content too brief for analysis.`;
  }

  // Extract first meaningful sentences for summary
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 20)
    .slice(0, 3)
    .map(s => s.trim())
    .join('. ');

  // Detect specific legal document types
  const lowerText = text.toLowerCase();
  const lowerFilename = filename.toLowerCase();
  
  let prefix = "Document Summary: ";
  let specialContext = "";

  // CPS-related documents
  if (lowerText.includes("cps") || lowerText.includes("child protective") || lowerFilename.includes("cps")) {
    prefix = "CPS Document Summary: ";
    if (lowerText.includes("investigation") || lowerText.includes("report")) {
      specialContext = " [Potential MCL 722.628 violation evidence]";
    }
  }
  
  // Court documents
  else if (lowerText.includes("court") || lowerText.includes("judge") || lowerText.includes("hearing") || lowerFilename.includes("court")) {
    prefix = "Court Document Summary: ";
    if (lowerText.includes("notice") || lowerText.includes("hearing")) {
      specialContext = " [Due process implications]";
    }
  }
  
  // Medical/Psychological documents
  else if (lowerText.includes("psychological") || lowerText.includes("medical") || lowerText.includes("therapy") || lowerFilename.includes("psych")) {
    prefix = "Medical/Psychological Summary: ";
    specialContext = " [Evidence of harm/trauma]";
  }
  
  // Legal correspondence
  else if (lowerText.includes("attorney") || lowerText.includes("lawyer") || lowerFilename.includes("legal")) {
    prefix = "Legal Correspondence Summary: ";
    if (lowerText.includes("brady") || lowerText.includes("evidence")) {
      specialContext = " [Potential Brady violation evidence]";
    }
  }

  const finalSummary = `${prefix}${sentences}${sentences.endsWith('.') ? '' : '.'}${specialContext}`;
  
  return finalSummary;
}

// Generate structured document summary card
function generateDocumentCard(doc) {
  const card = {
    title: doc.filename.replace(/\.[^/.]+$/, ""), // Remove file extension
    summary: doc.summary || "Processing...",
    category: doc.category || "Uncategorized",
    child: doc.child || "Unknown",
    misconduct: doc.misconduct || "Other/Multiple",
    tags: doc.statutes || [],
    legal_significance: "",
    linked_argument: ""
  };

  // Add legal significance based on content
  const text = (doc.summary || doc.filename || '').toLowerCase();
  
  if (text.includes("cps") && text.includes("investigation")) {
    card.legal_significance = "Demonstrates CPS failure to investigate per MCL 722.628";
    card.linked_argument = "This document corroborates systemic CPS misconduct and failure to protect children.";
  } else if (text.includes("psychological") || text.includes("trauma")) {
    card.legal_significance = "Documents psychological harm and trauma to children";
    card.linked_argument = "Supports claims of long-term damage due to state misconduct and due process violations.";
  } else if (text.includes("court") || text.includes("hearing")) {
    card.legal_significance = "Evidence of judicial misconduct or due process violations";
    card.linked_argument = "Demonstrates pattern of court bias and constitutional rights violations.";
  } else if (text.includes("brady") || text.includes("evidence")) {
    card.legal_significance = "Potential Brady v. Maryland evidence suppression";
    card.linked_argument = "Shows state withholding of exculpatory evidence in violation of federal law.";
  } else {
    card.legal_significance = "Supporting documentation for justice case";
    card.linked_argument = "Provides context and evidence supporting overall case for justice and accountability.";
  }

  return card;
}

async function tryLogin(username, password) {
  const r = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return r.ok;
}

function saveTracker(data) {
  localStorage.setItem('tracker', JSON.stringify(data));
}

function loadTracker() {
  try { return JSON.parse(localStorage.getItem('tracker')) ?? []; }
  catch { return []; }
}

function downloadCSV(rows) {
  const header = ['Filename','Summary','Category','Child','Misconduct','Duplicate','Legal_Statutes'];
  const body = rows.map(r => {
    const row = {
      filename: r.filename || '',
      summary: r.summary || '',
      category: r.category || '',
      child: r.child || '',
      misconduct: r.misconduct || '',
      duplicate: r.duplicate ? 'Yes' : 'No',
      legal_statutes: (r.statutes || []).join('; ')
    };
    return header.map(h => JSON.stringify(row[h.toLowerCase()] ?? '')).join(',');
  });
  const csv = [header.join(','), ...body].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'justice_tracker_enhanced.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ===== 2. State =====
const tracker = loadTracker();           // array of row objects
const hashSet = new Set(tracker.map(r => r.hash));

// ===== 3. DOM refs =====
const fileInput   = $('#fileInput');
// const uploadBtn   = $('#uploadBtn'); // Currently unused
const tbody       = $('#trackerTable tbody');
const searchInput = $('#searchInput');
const childFilter = $('#childFilter');
const exportBtn   = $('#exportCsv');

// ===== 4. Render existing tracker =====
function initializeTracker() {
  // Clear existing table content
  tbody.innerHTML = '';
  // Render all tracker items
  tracker.forEach(addRowToTable);
}

// Auto-load tracker on page load
document.addEventListener('DOMContentLoaded', initializeTracker);
// Also initialize immediately in case DOM is already loaded
if (document.readyState === 'loading') {
  // DOMContentLoaded will handle it
} else {
  // DOM is already ready
  initializeTracker();
}

// ===== 5. Event wiring =====
function wireEvents() {
  // Ensure DOM elements exist before wiring events
  if (fileInput) fileInput.addEventListener('change', handleFiles);
  if (searchInput) searchInput.addEventListener('keyup', filterRows);
  if (childFilter) childFilter.addEventListener('change', filterRows);
  if (exportBtn) exportBtn.addEventListener('click', () => downloadCSV(tracker));

  // Drag‑and‑drop (optional UI — ensure drop zone exists)
  ['dragover','drop'].forEach(evt => document.addEventListener(evt, e => {
    if(['dragover','drop'].includes(e.type)) e.preventDefault();
    if(e.type==='drop') handleFiles({ target: { files: e.dataTransfer.files }});
  }, false));
}

// Wire events when DOM is ready
document.addEventListener('DOMContentLoaded', wireEvents);
// Also wire immediately in case DOM is already loaded
if (document.readyState === 'loading') {
  // DOMContentLoaded will handle it
} else {
  // DOM is already ready
  wireEvents();
}

// ===== 6. Core functions =====
async function handleFiles(e) {
  const files = [...e.target.files];
  if (!files.length) return;

  for (const file of files) {
    const fname = file.name; // ⇢ cache synchronously before any async operations

    // 6.1 Duplicate detection (hash)
    const hash = await sha256(file);
    if (hashSet.has(hash)) {
      console.warn(`${fname} skipped (duplicate)`);
      // Add duplicate row to table
      const duplicateRow = {
        filename: fname,
        summary: 'Duplicate file detected',
        category: 'Duplicate',
        child: 'N/A',
        misconduct: 'N/A',
        duplicate: true,
        hash
      };
      addRowToTable(duplicateRow);
      continue;
    }

    // Create optimistic placeholder row
    const placeholder = {
      filename: fname,
      summary: 'Uploading…',
      category: '—',
      child: '—',
      misconduct: '—',
      duplicate: false,
      hash
    };
    
    // Add optimistic UI immediately
    const rowIndex = tracker.length;
    tracker.push(placeholder);
    addRowToTable(placeholder);

    // 6.2 Send to server
    const formData = new FormData();
    formData.append('file', file, fname);

    try {
      const res = await fetch('/upload', { method: 'POST', body: formData });
      
      if (!res.ok) {
        // Handle HTTP error responses
        let errorMessage = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Failed to parse error JSON, use status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const { summary, category, child, misconduct } = await res.json();
      
      // Enhance summary with legal content detection if needed
      const enhancedSummary = summary || generateSummary(summary || '', fname);
      
      // Update the existing row object
      placeholder.summary = enhancedSummary;
      placeholder.category = category || 'Uncategorized';
      placeholder.child = child || 'Unknown';
      placeholder.misconduct = misconduct || 'Other/Multiple';
      
      // Add legal statute tags
      placeholder.statutes = tagStatutes({
        content: summary || '',
        filename: fname,
        summary: enhancedSummary
      });
      
      // Update the DOM row (find by index)
      updateRowInTable(rowIndex, placeholder);
      hashSet.add(hash);
      
      // Clean up duplicates before saving
      const cleanTracker = removeDuplicates(tracker);
      saveTracker(cleanTracker);
      
    } catch (err) {
      console.error('Upload failed', err);
      
      // Handle different types of errors
      let errorMessage = 'Upload failed';
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_RESET')) {
        errorMessage = 'Connection error - server may be processing';
      } else if (err.message.includes('file too large')) {
        errorMessage = 'File too large (max 50MB)';
      } else if (err.message) {
        errorMessage = `Upload failed: ${err.message}`;
      }
      
      // Update row to show specific error
      placeholder.summary = errorMessage;
      placeholder.category = 'Error';
      placeholder.misconduct = 'Error';
      updateRowInTable(rowIndex, placeholder);
    }
  }

  // reset input so same file list can be selected again
  fileInput.value = '';
}

function addRowToTable(row) {
  const tr = document.createElement('tr');
  const statutesText = (row.statutes || []).length > 0 
    ? (row.statutes || []).join(', ') 
    : '—';
  
  tr.innerHTML = [
    row.filename, 
    row.summary, 
    row.category, 
    row.child, 
    row.misconduct || 'Other/Multiple',
    statutesText,
    row.duplicate ? 'Yes' : 'No'
  ].map(val => `<td class="border px-2 py-1 text-sm">${val}</td>`).join('');
  tbody.appendChild(tr);
}

function updateRowInTable(rowIndex, updatedRow) {
  const rows = tbody.querySelectorAll('tr');
  if (rows[rowIndex]) {
    const statutesText = (updatedRow.statutes || []).length > 0 
      ? (updatedRow.statutes || []).join(', ') 
      : '—';
    
    rows[rowIndex].innerHTML = [
      updatedRow.filename, 
      updatedRow.summary, 
      updatedRow.category, 
      updatedRow.child, 
      updatedRow.misconduct || 'Other/Multiple',
      statutesText,
      updatedRow.duplicate ? 'Yes' : 'No'
    ].map(val => `<td class="border px-2 py-1 text-sm">${val}</td>`).join('');
  }
}

function filterRows() {
  const query = searchInput.value.toLowerCase();
  const child = childFilter.value;
  $$('#trackerTable tbody tr').forEach(tr => {
    const cells = tr.children;
    const textMatch = cells[1].textContent.toLowerCase().includes(query) ||
                      cells[0].textContent.toLowerCase().includes(query);
    const childMatch = !child || cells[3].textContent === child;
    tr.style.display = (textMatch && childMatch) ? '' : 'none';
  });
}

// ===== 7. Login form handling =====
document.addEventListener("DOMContentLoaded", () => {
  const box      = document.getElementById("loginBox");
  const dash     = document.getElementById("dashboard");     // wrap the main UI in a #dashboard div
  const btn      = document.getElementById("loginBtn");
  const errLabel = document.getElementById("loginErr");

  if (dash) dash.classList.add("hidden");          // hide dashboard until logged in

  if (btn) {
    btn.addEventListener("click", async () => {
      const ok = await tryLogin(
        document.getElementById("userInput").value,
        document.getElementById("passInput").value
      );
      if (ok) {
        if (box) box.classList.add("hidden");
        if (dash) dash.classList.remove("hidden");   // show dashboard
        if (errLabel) errLabel.classList.add("hidden");
      } else {
        if (errLabel) errLabel.classList.remove("hidden");
      }
    });
  }
});

// ===== 8. Hot‑reload support (Vite) =====
if (import.meta.hot) {
  import.meta.hot.accept();
}
