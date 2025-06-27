/* Justice Dashboard – front-end logic v1.1.1  ✨
   – Auto-detect child names
   – Truncate long summaries
   – Editable misconduct dropdown (now with id/name)
*/

/********** DOM **********/
const fileInput    = document.getElementById("fileUpload");
const docInput     = document.getElementById("docInput");
const summarizeBtn = document.getElementById("summarizeBtn");
const exportBtn    = document.getElementById("exportBtn");
const askBtn       = document.getElementById("askLawGpt");
const summaryBox   = document.getElementById("summaryBox");
const trackerBody  = document.querySelector("#trackerTable tbody");

/********** Restore saved rows **********/
(() => {
  const saved = localStorage.getItem("justiceTrackerRows");
  if (saved) trackerBody.innerHTML = saved;
})();

/********** PDF → plain-text helper **********/
async function pdfToText(file) {
  const buffer = await file.arrayBuffer();
  const pdf    = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map(i => i.str).join(" ") + "\n";
  }
  return text.trim();
}

/********** Quick summary (truncate 200 chars) **********/
const quickSummary = t => {
  const clean = t.replace(/\s+/g, " ").trim();
  return clean.length > 200 ? clean.slice(0, 197) + "…" : clean;
};

/********** Auto-tag legal keywords **********/
function keywordTags(text) {
  const lib = {
    "Brady Violation":      /\bbrady\b|exculpatory/i,
    "Civil Rights":         /civil rights|§?1983/i,
    "CPS Negligence":       /cps (?:failed|negligence)/i,
    "Custody Interference": /denied visitation|interference/i
  };
  return Object.entries(lib)
    .filter(([, rgx]) => rgx.test(text))
    .map(([tag]) => tag);
}

/********** Auto-detect child **********/
function detectChild(text) {
  const kids = [
    "Jace", "Josh", "Joshua", "Peyton", "Owen", "Nicholas", "John", "Lou", "Eleanora"
  ];
  const found = kids.find(k => new RegExp(`\\b${k}\\b`, "i").test(text));
  return found || "Unknown";
}

/********** Persist table **********/
function saveTable() {
  localStorage.setItem("justiceTrackerRows", trackerBody.innerHTML);
}

/********** Build misconduct <select> with id & name **********/
function buildMisconductSelect(value = "Review Needed") {
  const sel = document.createElement("select");
  const uid = `misconduct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  sel.id   = uid;
  sel.name = uid;
  sel.className = "bg-transparent text-sm";

  [
    "Review Needed",
    "CPS Negligence",
    "Civil Rights Violation",
    "Medical Malpractice",
    "Custody Interference"
  ].forEach(opt => {
    const o = document.createElement("option");
    o.value = o.textContent = opt;
    sel.appendChild(o);
  });

  sel.value   = value;
  sel.onchange = saveTable;
  return sel;
}

/********** Add row **********/
function addRow({ category, child, misconduct, summary, tags, fileURL, fileName }) {
  const tr = trackerBody.insertRow();
  tr.insertCell().innerText = category;
  tr.insertCell().innerText = child;
  tr.insertCell().appendChild(buildMisconductSelect(misconduct));
  const sumTd = tr.insertCell();
  sumTd.textContent = summary;
  sumTd.title       = summary;
  tr.insertCell().innerText = tags.join(", ");
  const viewTd = tr.insertCell();
  if (fileURL) {
    const btn = document.createElement("button");
    btn.className = "px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600";
    btn.innerText = "View PDF";
    btn.onclick   = () => openPdf(fileURL, fileName);
    viewTd.appendChild(btn);
  } else viewTd.innerText = "N/A";
  saveTable();
}

/********** PDF viewer modal **********/
function openPdf(url, name) {
  pdfFrame.src = url;
  pdfTitle.textContent = name;
  pdfViewerModal.classList.replace("hidden", "flex");
}
window.closeViewer = () => pdfViewerModal.classList.replace("flex", "hidden");

/********** Main summarise handler **********/
summarizeBtn.onclick = async () => {
  if (!fileInput.files[0] && !docInput.value.trim()) {
    alert("Upload a PDF or paste text first.");
    return;
  }

  let text     = docInput.value.trim();
  let fileURL  = null;
  let fileName = null;

  if (fileInput.files[0]) {
    const file = fileInput.files[0];
    fileURL    = URL.createObjectURL(file);
    fileName   = file.name;
    if (!text) text = await pdfToText(file);
  }

  const summary = quickSummary(text);
  summaryBox.textContent = summary;
  addRow({
    category: fileURL ? "Uploaded Document" : "Manual Entry",
    child: detectChild(text),
    misconduct: "Review Needed",
    summary,
    tags: keywordTags(text),
    fileURL,
    fileName
  });

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
const res = await fetch("/api/summarize", {
      method: "POST",
      body: formData
    });
    if (!res.ok) return alert("Failed to get summary");

    const data = await res.json();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>Evidence</td>
      <td>Unknown</td>
      <td>Unspecified</td>
      <td>Summary: ${data.summary.slice(0, 50)}...</td>
      <td><a href="http://localhost:3000${data.fileURL}" target="_blank">View</a></td>
    `;
    table.appendChild(row);
  } catch (err) {
    console.error(err);
    alert("An error occurred while processing the file.");
  }
};

/********** Export CSV **********/
exportBtn.onclick = () => {
  const headers = Array.from(document.querySelectorAll("#trackerTable thead th"))
    .map(th => th.textContent);
  const rows = Array.from(trackerBody.querySelectorAll("tr"))
    .map(tr => Array.from(tr.children).map(td => td.innerText.replace(/\n/g, " ").replace(/"/g, '""'))
      .join(","));
  const csv = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a    = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: "justice_tracker.csv"
  });
  a.click();
};

/********** Ask Law GPT **********/
// Dashboard functionality
const statsDisplay = document.getElementById('statsDisplay');
const categoryFilter = document.getElementById('categoryFilter');
const misconductFilter = document.getElementById('misconductFilter');
function updateDashboardStats() {
  const rows = Array.from(trackerBody.querySelectorAll('tr'));
  const totalCases = rows.length;
  const activeCases = rows.filter(row => 
    row.querySelector('select').value !== 'Review Needed'
  ).length;
  document.getElementById('totalCases').textContent = totalCases;
  document.getElementById('activeCases').textContent = activeCases;
}
function populateFilters() {
  const categories = new Set();
  const misconductTypes = new Set();
  
  Array.from(trackerBody.querySelectorAll('tr')).forEach(row => {
    categories.add(row.cells[0].textContent);
    misconductTypes.add(row.querySelector('select').value);
    });
  
  // Populate filter dropdowns
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  
  misconductTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = option.textContent = type;
    misconductFilter.appendChild(option);
  });
}
  askBtn.onclick = async () => {
    const response = await fetch('/api/lawgpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: summaryBox.textContent })
    });
    
    try {
      const data = await response.json();
    alert(data.answer || data.error || "No answer");
  } catch (err) {
    alert("Network error: " + err.message);
  }
};

// Remove duplicate event listener code