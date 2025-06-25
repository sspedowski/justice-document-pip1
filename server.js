/* Justice Dashboard – front-end logic v1.1.1 ✨
   • Auto-detect child names
   • Truncate long summaries
   • Editable misconduct dropdown (id + name for a11y / form posts)
   • Keyword tagging
   • Table persistence to localStorage
*/

//// ────────── DOM refs ──────────
const fileInput    = document.getElementById("fileUpload");
const docInput     = document.getElementById("docInput");
const summarizeBtn = document.getElementById("summarizeBtn");
const exportBtn    = document.getElementById("exportBtn");
const askBtn       = document.getElementById("askLawGpt");
const summaryBox   = document.getElementById("summaryBox");
const trackerBody  = document.querySelector("#trackerTable tbody");

//// ────────── restore saved rows ──────────
(() => {
  const saved = localStorage.getItem("justiceTrackerRows");
  if (saved) trackerBody.innerHTML = saved;
})();

//// ────────── PDF → text helper (PDF.js) ──────────
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

//// ────────── tiny summary helper (≤200 chars) ──────────
const quickSummary = t => {
  const clean = t.replace(/\s+/g, " ").trim();
  return clean.length > 200 ? clean.slice(0, 197) + "…" : clean;
};

//// ────────── keyword → tag map ──────────
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

//// ────────── child detector ──────────
function detectChild(text) {
  const kids = [
    "Jace", "Josh", "Joshua", "Peyton", "Owen",
    "Nicholas", "John", "Lou", "Eleanora"
  ];
  const found = kids.find(k => new RegExp(`\\b${k}\\b`, "i").test(text));
  return found || "Unknown";
}

//// ────────── localStorage persistence ──────────
const saveTable = () =>
  localStorage.setItem("justiceTrackerRows", trackerBody.innerHTML);

//// ────────── misconduct <select> builder (id & name) ──────────
function buildMisconductSelect(value = "Review Needed") {
  const sel = document.createElement("select");
  const uid = `misconduct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  sel.id = sel.name = uid;
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

  sel.value    = value;
  sel.onchange = saveTable;
  return sel;
}

//// ────────── add tracker row ──────────
function addRow({ category, child, misconduct, summary, tags, fileURL, fileName }) {
  const tr = trackerBody.insertRow();

  tr.insertCell().textContent = category;           // Category
  tr.insertCell().textContent = child;              // Child
  tr.insertCell().appendChild(buildMisconductSelect(misconduct)); // Misconduct

  const sumTd = tr.insertCell();                    // Summary
  sumTd.textContent = summary;
  sumTd.title       = summary;

  tr.insertCell().textContent = tags.join(", ");    // Tags

  const viewTd = tr.insertCell();                   // View button
  if (fileURL) {
    const btn   = document.createElement("button");
    btn.className = "px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600";
    btn.textContent = "View PDF";
    btn.onclick   = () => openPdf(fileURL, fileName);
    viewTd.appendChild(btn);
  } else {
    viewTd.textContent = "N/A";
  }

  saveTable();
}

//// ────────── PDF viewer modal helpers ──────────
function openPdf(url, name) {
  pdfFrame.src         = url;
  pdfTitle.textContent = name;
  pdfViewerModal.classList.replace("hidden", "flex");
}
window.closeViewer = () =>
  pdfViewerModal.classList.replace("flex", "hidden");

//// ────────── main summarise handler ──────────
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
    category:  fileURL ? "Uploaded Document" : "Manual Entry",
    child:     detectChild(text),
    misconduct:"Review Needed",
    summary,
    tags:      keywordTags(text),
    fileURL,
    fileName
  });
};

//// ────────── CSV export ──────────
exportBtn.onclick = () => {
  const headers = Array.from(document.querySelectorAll("#trackerTable thead th"))
    .map(th => th.textContent);
  const rows = Array.from(trackerBody.querySelectorAll("tr"))
    .map(tr =>
      Array.from(tr.children).map(td =>
        td.querySelector("button")
          ? "PDF"
          : `"${td.innerText.replace(/\n/g, " ").replace(/"/g, '""')}"`)
      .join(",")
    );
  const csv  = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a    = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: "justice_tracker.csv"
  });
  a.click();
};

//// ────────── Ask Law GPT hook ──────────
askBtn.onclick = async () => {
  const prompt = summaryBox.textContent || "Explain this document";
  try {
    const res  = await fetch("/api/lawgpt", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt })
    });
    const data = await res.json();
    alert(data.answer || data.error || "No answer");
  } catch (err) {
    alert("Network error: " + err.message);
  }
};
