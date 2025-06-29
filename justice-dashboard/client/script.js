/* Justice Dashboard — client/script.js (v2)
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
const uploadBtn   = $('#uploadBtn');
const tbody       = $('#trackerTable tbody');
const searchInput = $('#searchInput');
const childFilter = $('#childFilter');
const exportBtn   = $('#exportCsv');

// ===== 4. Render existing tracker =====
tracker.forEach(addRowToTable);

// ===== 5. Event wiring =====
fileInput.addEventListener('change', handleFiles);
searchInput.addEventListener('keyup', filterRows);
childFilter.addEventListener('change', filterRows);
exportBtn.addEventListener('click', () => downloadCSV(tracker));

// Drag‑and‑drop (optional UI — ensure drop zone exists)
['dragover','drop'].forEach(evt => document.addEventListener(evt, e => {
  if(['dragover','drop'].includes(e.type)) e.preventDefault();
  if(e.type==='drop') handleFiles({ target: { files: e.dataTransfer.files }});
}, false));

// ===== 6. Core functions =====
async function handleFiles(e) {
  const files = [...e.target.files];
  if (!files.length) return;

  for (const file of files) {
    // 6.1 Duplicate detection (hash)
    const hash = await sha256(file);
    if (hashSet.has(hash)) {
      console.warn(`${file.name} skipped (duplicate)`);
      continue;
    }

    // 6.2 Send to server
    const formData = new FormData();
    formData.append('file', file, file.name);

    let summaryPayload;
    try {
      const res = await fetch('/upload', { method: 'POST', body: formData });
      summaryPayload = await res.json();
    } catch (err) {
      console.error('Upload failed', err);
      continue;
    }

    // Expected response shape:
    // { summary, category, child }
    const rowObj = {
      filename: file.name,
      summary: summaryPayload.summary || '—',
      category: summaryPayload.category || 'Uncategorized',
      child: summaryPayload.child || 'Unknown',
      duplicate: false,
      hash
    };

    tracker.push(rowObj);
    hashSet.add(hash);
    addRowToTable(rowObj);
    saveTracker(tracker);
  }

  // reset input so same file list can be selected again
  fileInput.value = '';
}

function addRowToTable(row) {
  const tr = document.createElement('tr');
  tr.innerHTML = [row.filename, row.summary, row.category, row.child, row.duplicate ? 'Yes' : 'No']
    .map(val => `<td class="border px-2 py-1 text-sm">${val}</td>`).join('');
  tbody.appendChild(tr);
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
