/* Justice Dashboard — client-side (v2) */

// CSV download helper function
function downloadCSV(rows) {
  const header = ['Filename','Summary','Category','Child','Misconduct','Duplicate'];
  const body = rows.map(r => header.map(h => JSON.stringify(r[h.toLowerCase()] ?? '')).join(','));
  const csv = [header.join(','), ...body].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'tracker.csv'; a.click();
  URL.revokeObjectURL(url);
}

/*
   Features added:
   • Multi‑file upload (drag‑and‑drop or file input)
   • SHA‑256 duplicate detection client‑side
   • Tracker persisted in localStorage (key: "tracker")
   • Search bar + child filter
   • CSV export including new columns: child, category, duplicate
   • Enhanced legal statute tagging with document-specific detection
   • Summary cards for detailed document analysis
   • Toggle view for summary cards with legal significance indicators
*/

// ===== Authentication State =====
const auth = {
  user: null,
  token: null,
  isAuthenticated: false
};

// ===== 1. Utility helpers =====
const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

async function sha256(file) {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
  if (text.includes('due process') || text.includes('14th amendment'))
    statutes.push('14th Amendment – Due Process');
  if (text.includes('1st amendment'
