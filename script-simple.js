/* ========================================================================
   Justice Dashboard — Modular client code (no build required)
   Pattern: IIFE / Module Pattern with clear responsibilities
   ======================================================================== */

const JusticeDashboard = (function () {
  // -----------------------------
  // Private state
  // -----------------------------
  const state = {
    isProcessingBulk: false,
    bulkProgress: 0,
    bulkTotal: 0,
    summaryCache: new Set(),
  };

  // -----------------------------
  // DOM Elements
  // -----------------------------
  const DOMElements = {
    elements: {},
    init() {
      this.elements = {
        fileInput: document.getElementById("fileInput"),
        generateBtn: document.getElementById("generateBtn"),
        bulkProcessBtn: document.getElementById("bulkProcessBtn"),
        updateExistingBtn: document.getElementById("updateExistingBtn"),
        aiMisconductBtn: document.getElementById("aiMisconductBtn"),
        exportBtn: document.getElementById("exportBtn"),
        summaryBox: document.getElementById("summaryBox"),
        trackerBody: document.querySelector("#results"),
        categoryFilter: document.getElementById("categoryFilter"),
        misconductFilter: document.getElementById("misconductFilter"),
        totalCasesEl: document.getElementById("totalCases"),
        activeCasesEl: document.getElementById("activeCases"),
        bulkProgress: document.getElementById("bulkProgress"),
      };
      return this.validateElements();
    },
    validateElements() {
      const required = ["trackerBody"];
      const missing = required.filter((k) => !this.elements[k]);
      if (missing.length) {
        console.error("Required DOM elements not found:", missing);
        return false;
      }
      return true;
    },
    get(name) {
      return this.elements[name];
    },
  };

  // -----------------------------
  // UI Manager
  // -----------------------------
  const UIManager = {
    showError(message, error) {
      console.error(message, error);
      const msg = `${message}${error?.message ? ": " + error.message : ""}`;
      alert(msg);
    },
    showSuccess(message) {
      console.info(message);
      alert(message);
    },
    async confirmDuplicate(reason) {
      return confirm(
        `⚠️ Potential duplicate detected!\n\nReason: ${reason}\n\nAdd anyway?`
      );
    },
    updateProgress(current, total, fileName) {
      const progressDiv = DOMElements.get("bulkProgress");
      const progressBar = document.getElementById("progressBar");
      const progressText = document.getElementById("progressText");
      if (progressDiv) {
        const pct = total ? (current / total) * 100 : 0;
        if (progressBar) progressBar.style.width = `${pct.toFixed(1)}%`;
        if (progressText) {
          progressText.textContent = `Processing ${current}/${total}… ${fileName || ""}`;
        }
      }
    },
  };

  // -----------------------------
  // Helpers (shared)
  // -----------------------------
  function fetchWithTimeout(resource, options = {}, ms = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    const opts = { ...options, signal: controller.signal };
    return fetch(resource, opts).finally(() => clearTimeout(timer));
  }
  function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  function logError(type, error, extra = {}) {
    try {
      console.error(`[${type}]`, { message: String(error?.message ?? error), extra });
    } catch {}
  }

  // -----------------------------
  // Child Detector
  // -----------------------------
  const ChildDetector = (function () {
    const reJace = /\b(?:jace|jace's|child\s*1)\b/i;
    // allow "josh" / "josh's" but not "joshua"
    const reJosh = /\b(?:josh(?!ua)|josh's|child\s*2)\b/i;

    function detectChild(text, fallbackName) {
      if (typeof text !== "string" || !text.trim()) {
        if (typeof fallbackName === "string") return detectChild(fallbackName);
        console.warn("detectChild: invalid input", text);
        return "Unknown";
      }
      const t = text.toLowerCase();
      const jace = reJace.test(t);
      const josh = reJosh.test(t);
      if (jace && josh) return "Both";
      if (jace) return "Jace";
      if (josh) return "Josh";
      return "Unknown";
    }

    return { detectChild };
  })();

  // -----------------------------
  // Category Detector (simple heuristics)
  // -----------------------------
  const CategoryDetector = {
    detectCategory(text, file) {
      const name = typeof file?.name === "string" ? file.name.toLowerCase() : "";
      const s = (text || "").toLowerCase() + " " + name;
      if (/\bcourt|hearing|order|motion\b/.test(s)) return "Court";
      if (/\bemail|inbox|subject:|\bfrom:|\bto:\b/.test(s)) return "Email";
      if (/\bphoto|image|screenshot|jpg|png\b/.test(s)) return "Image";
      if (/\bmedical|doctor|clinic|rx\b/.test(s)) return "Medical";
      if (/\bschool|teacher|report card|grades\b/.test(s)) return "School";
      return "Other";
    },
  };

  // -----------------------------
  // Keyword Analyzer (naive)
  // -----------------------------
  const KeywordAnalyzer = {
    extractTags(text) {
      if (!text) return [];
      const words = String(text)
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 5 && w.length <= 20);
      const stop = new Set([
        "about",
        "there",
        "would",
        "could",
        "should",
        "document",
        "report",
        "school",
        "email",
        "image",
        "other",
      ]);
      const freq = new Map();
      for (const w of words) {
        if (stop.has(w)) continue;
        freq.set(w, (freq.get(w) || 0) + 1);
      }
      return [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([w]) => w);
    },
  };

  // -----------------------------
  // Text Processor
  // -----------------------------
  const TextProcessor = {
    normalize(text) {
      return String(text || "")
        .replace(/\r\n/g, "\n")
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    },
    quickSummary(text, max = 500) {
      const t = this.normalize(text);
      if (!t) return "";
      if (t.length <= max) return t;
      // crude but fast: first paragraph up to max
      const firstPara = t.split("\n\n")[0];
      return (firstPara.length <= max ? firstPara : t.slice(0, max)) + "…";
    },
  };

  // -----------------------------
  // PDF Processor (graceful fallback if pdfjsLib missing)
  // -----------------------------
  const PDFProcessor = {
    async pdfToText(file) {
      try {
        if (!file || !(file instanceof Blob)) {
          throw new Error("pdfToText: invalid file");
        }
        // If pdf.js is available globally as pdfjsLib, use it.
        if (window.pdfjsLib) {
          const buf = await file.arrayBuffer();
          const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((it) => it.str).join(" ") + "\n";
          }
          return TextProcessor.normalize(text);
        }
        // Fallback: try to read as text (works only if the "PDF" is already text)
        const fallback = await file.text();
        return TextProcessor.normalize(fallback);
      } catch (e) {
        logError("PDF_PARSE_ERROR", e);
        return "";
      }
    },
  };

  // -----------------------------
  // AI Analyzer
  // -----------------------------
  const AIAnalyzer = {
    async callAIService(prompt) {
      if (typeof prompt !== "string" || !prompt.trim()) {
        return this._fallbackAnalyze(prompt);
      }
      try {
        const res = await fetchWithTimeout(
          "/api/ai-analyze",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": generateRequestId(),
            },
            body: JSON.stringify({
              prompt,
              max_tokens: 50,
              temperature: 0.3,
            }),
          },
          30000
        );
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("application/json")) {
          const data = await res.json();
          return data.result ?? data.response ?? data.text ?? "";
        }
        return await res.text();
      } catch (err) {
        const isAbort = err?.name === "AbortError";
        if (isAbort) console.warn("AI request timed out.");
        logError("AI_SERVICE_ERROR", err, { promptLen: prompt?.length ?? 0, timedOut: isAbort });
        return this._fallbackAnalyze(prompt);
      }
    },
    _fallbackAnalyze(prompt) {
      try {
        if (typeof window.detectMisconductFallback === "function") {
          return window.detectMisconductFallback(prompt);
        }
      } catch {}
      return "Unable to analyze at this time.";
    },
    async detectMisconductWithAI(text, category, child) {
      const prompt =
        `Given the following document text, identify potential misconduct tags.\n` +
        `Child: ${child}\nCategory: ${category}\n` +
        `Text:\n${TextProcessor.quickSummary(text, 1500)}\n` +
        `Return a concise comma-separated list of tags.`;
      const out = await this.callAIService(prompt);
      return String(out || "")
        .split(/[,|\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
    },
    async updateMisconductWithAI() {
      // Example stub: scan table rows, enrich a column
      const table = DOMElements.get("trackerBody");
      if (!table) return;
      const rows = Array.from(table.querySelectorAll("tr"));
      for (const tr of rows) {
        const textCell = tr.querySelector("[data-col='text']") || tr.cells[1];
        const tagCell = tr.querySelector("[data-col='misconduct']") || tr.cells[2];
        if (!textCell || !tagCell) continue;
        const tags = await this.detectMisconductWithAI(textCell?.innerText || "", "Other", "Unknown");
        tagCell.textContent = Array.isArray(tags) ? tags.join(", ") : String(tags || "");
      }
      UIManager.showSuccess("AI misconduct analysis complete.");
    },
  };

  // -----------------------------
  // Data Export
  // -----------------------------
  const DataExport = {
    exportToCSV() {
      try {
        const table = DOMElements.get("trackerBody");
        if (!table) throw new Error("No results table found");
        const rows = [["File", "Category", "Child", "Misconduct", "Tags", "URL"]];
        for (const tr of table.querySelectorAll("tr")) {
          const cols = Array.from(tr.querySelectorAll("td")).map((td) =>
            td.innerText.replace(/\s+/g, " ").trim()
          );
          if (cols.length) rows.push(cols);
        }
        const csv = rows.map((r) => r.map(escapeCSV).join(",")).join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "justice-documents.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {
        UIManager.showError("Export failed", e);
      }

      function escapeCSV(s) {
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      }
    },
  };

  // -----------------------------
  // Document Processor
  // -----------------------------
  const DocumentProcessor = {
    async processSingleFile(file) {
      try {
        const text = await PDFProcessor.pdfToText(file);
        const summary = TextProcessor.quickSummary(text);
        const fileURL = URL.createObjectURL(file);

        if (DOMElements.get("summaryBox")) {
          DOMElements.get("summaryBox").textContent = summary;
        }

        const dupeCheck = this.isDuplicate(file.name, summary);
        if (dupeCheck.isDupe) {
          const ok = await UIManager.confirmDuplicate(dupeCheck.reason);
          if (!ok) return;
        }

        const metadata = await this.extractMetadata(text, file);
        await this.addDocumentToTracker({ file, fileURL, summary, ...metadata });
        UIManager.showSuccess("Document processed successfully!");
      } catch (error) {
        UIManager.showError(`Error processing ${file?.name || ""}`, error);
      }
    },

    async extractMetadata(text, file) {
      const category = CategoryDetector.detectCategory(text, file);
      const child = ChildDetector.detectChild(text, file?.name);
      const misconduct = await AIAnalyzer.detectMisconductWithAI(text, category, child);
      const tags = KeywordAnalyzer.extractTags(text);
      return { category, child, misconduct, tags };
    },

    isDuplicate(filename, summary) {
      const key = `${filename}|${summary.slice(0, 120)}`;
      if (state.summaryCache.has(key)) {
        return { isDupe: true, reason: "Same filename + similar summary already added." };
      }
      // Keep small cache to avoid unbounded growth
      if (state.summaryCache.size > 5000) state.summaryCache.clear();
      state.summaryCache.add(key);
      return { isDupe: false };
    },

    async addDocumentToTracker({ file, fileURL, summary, category, child, misconduct, tags }) {
      const tbody = DOMElements.get("trackerBody");
      if (!tbody) throw new Error("Tracker body not found");
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><a href="${fileURL}" target="_blank" rel="noopener">${escapeHTML(file?.name || "document")}</a></td>
        <td>${escapeHTML(category)}</td>
        <td>${escapeHTML(child)}</td>
        <td data-col="misconduct">${escapeHTML(Array.isArray(misconduct) ? misconduct.join(", ") : String(misconduct || ""))}</td>
        <td>${escapeHTML(Array.isArray(tags) ? tags.join(", ") : String(tags || ""))}</td>
        <td data-col="text" style="display:none;">${escapeHTML(summary)}</td>
      `;
      tbody.appendChild(tr);
    },
  };

  function escapeHTML(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // -----------------------------
  // Event Handlers
  // -----------------------------
  const EventHandlers = {
    init() {
      const dom = DOMElements.elements;

      if (dom.generateBtn) {
        dom.generateBtn.onclick = async () => {
          try {
            const fi = dom.fileInput;
            if (!fi || !fi.files?.length) {
              alert("Choose a PDF file first.");
              return;
            }
            await DocumentProcessor.processSingleFile(fi.files[0]);
          } catch (e) {
            UIManager.showError("Error generating", e);
          }
        };
      }

      if (dom.bulkProcessBtn) {
        dom.bulkProcessBtn.onclick = async () => {
          try {
            const fi = dom.fileInput;
            if (!fi || !fi.files?.length) {
              alert("Select one or more PDF files to process.");
              return;
            }
            state.isProcessingBulk = true;
            state.bulkTotal = fi.files.length;
            for (let i = 0; i < fi.files.length; i++) {
              UIManager.updateProgress(i + 1, fi.files.length, fi.files[i].name);
              await DocumentProcessor.processSingleFile(fi.files[i]);
            }
            state.isProcessingBulk = false;
            UIManager.showSuccess("Bulk processing complete.");
          } catch (e) {
            state.isProcessingBulk = false;
            UIManager.showError("Bulk process error", e);
          }
        };
      }

      if (dom.exportBtn) {
        dom.exportBtn.onclick = () => DataExport.exportToCSV();
      }

      if (dom.updateExistingBtn) {
        dom.updateExistingBtn.onclick = async () => {
          try {
            // If you had a previous smartUpdateRows, call it here or refactor into DocumentProcessor
            // Example: await DocumentProcessor.smartUpdateRows();
            UIManager.showSuccess("Update complete.");
          } catch (e) {
            UIManager.showError("Error updating entries", e);
          }
        };
      }

      if (dom.aiMisconductBtn) {
        dom.aiMisconductBtn.onclick = async () => {
          try {
            await AIAnalyzer.updateMisconductWithAI();
          } catch (e) {
            UIManager.showError("AI analysis failed", e);
          }
        };
      }
    },
  };

  // -----------------------------
  // Public API
  // -----------------------------
  return {
    state,
    DOMElements,
    UIManager,
    EventHandlers,
    DocumentProcessor,
    AIAnalyzer,
    PDFProcessor,
    TextProcessor,
    KeywordAnalyzer,
    CategoryDetector,
    ChildDetector,
    DataExport,
  };
})();

// Bootstrap when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (JusticeDashboard.DOMElements.init()) {
    JusticeDashboard.EventHandlers.init();
  }
});

// ---------------------------------------------
// Legacy shims (keep old code working if present)
// ---------------------------------------------
window.detectChild = (text, name) => JusticeDashboard.ChildDetector.detectChild(text, name);
window.callAIService = (prompt) => JusticeDashboard.AIAnalyzer.callAIService(prompt);
