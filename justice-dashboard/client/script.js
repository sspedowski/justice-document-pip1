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

function saveTracker(data) {
  localStorage.setItem('tracker', JSON.stringify(data));
}

function loadTracker() {
  try { return JSON.parse(localStorage.getItem('tracker')) ?? []; }
  catch { return []; }
}

function downloadCSV(rows) {
  const header = ['Filename','Summary','Category','Child','Duplicate'];
  const body = rows.map(r => header.map(h => JSON.stringify(r[h.toLowerCase()] ?? '')).join(','));
  const csv = [header.join(','), ...body].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'tracker.csv'; a.click();
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
      
      // Update the existing row object
      placeholder.summary = summary || '—';
      placeholder.category = category || 'Uncategorized';
      placeholder.child = child || 'Unknown';
      placeholder.misconduct = misconduct || 'Other/Multiple';
      
      // Update the DOM row (find by index)
      updateRowInTable(rowIndex, placeholder);
      hashSet.add(hash);
      saveTracker(tracker);
      
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
  tr.innerHTML = [
    row.filename, 
    row.summary, 
    row.category, 
    row.child, 
    row.misconduct || 'Other/Multiple', 
    row.duplicate ? 'Yes' : 'No'
  ].map(val => `<td class="border px-2 py-1 text-sm">${val}</td>`).join('');
  tbody.appendChild(tr);
}

function updateRowInTable(rowIndex, updatedRow) {
  const rows = tbody.querySelectorAll('tr');
  if (rows[rowIndex]) {
    rows[rowIndex].innerHTML = [
      updatedRow.filename, 
      updatedRow.summary, 
      updatedRow.category, 
      updatedRow.child, 
      updatedRow.misconduct || 'Other/Multiple',
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

// ===== 7. Hot‑reload support (Vite) =====
if (import.meta.hot) {
  import.meta.hot.accept();
}
