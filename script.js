/* Justice Dashboard – front-end logic v1.2.0 ✨ WITH DASHBOARD ACCESS */

// Global variables for dashboard access
let currentUser = null;
let isAuthenticated = false;

/********** Dashboard Access System **********/
const DashboardAuth = {
  users: [
    { 
      username: 'admin', 
      password: 'justice2024', 
      role: 'admin',
      fullName: 'System Administrator'
    },
    { 
      username: 'stephanie', 
      password: 'spedowski2024', 
      role: 'user',
      fullName: 'Stephanie Spedowski'
    },
    { 
      username: 'legal', 
      password: 'legal123', 
      role: 'user',
      fullName: 'Legal Team'
    }
  ],

  authenticate(username, password) {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      currentUser = { ...user };
      delete currentUser.password; // Remove password from memory
      isAuthenticated = true;
      localStorage.setItem('justiceAuth', JSON.stringify(currentUser));
      return true;
    }
    return false;
  },

  logout() {
    currentUser = null;
    isAuthenticated = false;
    localStorage.removeItem('justiceAuth');
    this.showLoginForm();
  },

  checkAuth() {
    const saved = localStorage.getItem('justiceAuth');
    if (saved) {
      currentUser = JSON.parse(saved);
      isAuthenticated = true;
      return true;
    }
    return false;
  },

  showLoginForm() {
    document.body.innerHTML = `
      <div class="min-h-screen bg-gray-100 flex items-center justify-center">
        <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Justice Dashboard</h1>
            <p class="text-gray-600 mt-2">Secure Access Portal</p>
          </div>
          
          <form id="loginForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Username</label>
              <input type="text" id="username" required 
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" id="password" required 
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            
            <button type="submit" 
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Access Dashboard
            </button>
          </form>
          
          <div id="loginError" class="mt-4 text-red-600 text-sm hidden"></div>
          
          <div class="mt-6 text-xs text-gray-500 text-center">
            <p><strong>Demo Accounts:</strong></p>
            <p>admin / justice2024 (Full Access)</p>
            <p>stephanie / spedowski2024 (User Access)</p>
            <p>legal / legal123 (User Access)</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('loginError');

      if (this.authenticate(username, password)) {
        this.loadDashboard();
      } else {
        errorDiv.textContent = 'Invalid username or password';
        errorDiv.classList.remove('hidden');
      }
    });
  },

  loadDashboard() {
    // Load the main dashboard HTML
    document.body.innerHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Justice Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      </head>
      <body class="bg-gray-100">
        <!-- Header with user info and logout -->
        <header class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 class="text-xl font-bold text-gray-900">Justice Dashboard</h1>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-600">Welcome, ${currentUser.fullName}</span>
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${currentUser.role}</span>
              <button onclick="DashboardAuth.logout()" 
                class="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                Logout
              </button>
            </div>
          </div>
        </header>

        <div class="max-w-4xl mx-auto p-6">
          <!-- Daily Scripture Section -->
          <div class="bg-white rounded shadow p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">📖 Daily Scripture & Prayer</h2>
            <blockquote class="bg-blue-100 p-4 italic mb-6">
              Proverbs 21:15 - Justice brings joy to the righteous.
            </blockquote>
            
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">⚡ Your Prayer for Today</label>
              <textarea id="docInput" placeholder="Write your prayer here..." 
                class="w-full border p-2 mb-6 rounded shadow"></textarea>
            </div>
          </div>

          <!-- Justice Dashboard Section -->
          <div class="bg-white rounded shadow p-6">
            <h2 class="text-xl font-bold mb-4">Justice Dashboard</h2>
            
            <!-- File Upload and Controls -->
            <div class="mb-6 space-y-4">
              <div>
                <input type="file" id="fileInput" accept=".pdf" 
                  class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
              </div>
              
              <div class="flex space-x-4">
                <button id="generateBtn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Generate Summary
                </button>
                <button id="exportBtn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Export CSV
                </button>
                <button id="askLawGpt" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                  Ask Law GPT
                </button>
              </div>
            </div>

            <!-- Summary Display -->
            <div id="summaryBox" class="bg-gray-50 border p-4 rounded mb-6 min-h-[100px]">
              Summary will appear here...
            </div>

            <!-- Dashboard Stats -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-blue-50 p-4 rounded">
                <h3 class="font-semibold text-blue-800">Total Cases</h3>
                <p id="totalCases" class="text-2xl font-bold text-blue-600">0</p>
              </div>
              <div class="bg-green-50 p-4 rounded">
                <h3 class="font-semibold text-green-800">Active Cases</h3>
                <p id="activeCases" class="text-2xl font-bold text-green-600">0</p>
              </div>
            </div>

            <!-- Filters -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <select id="categoryFilter" class="border p-2 rounded">
                <option value="">All Categories</option>
              </select>
              <select id="misconductFilter" class="border p-2 rounded">
                <option value="">All Types</option>
              </select>
            </div>

            <!-- Cases Table -->
            <div class="overflow-x-auto">
              <table id="trackerTable" class="w-full border-collapse border border-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="border border-gray-300 p-2">Category</th>
                    <th class="border border-gray-300 p-2">Child</th>
                    <th class="border border-gray-300 p-2">Misconduct</th>
                    <th class="border border-gray-300 p-2">Summary</th>
                    <th class="border border-gray-300 p-2">Tags</th>
                    <th class="border border-gray-300 p-2">Actions</th>
                  </tr>
                </thead>
                <tbody id="results">
                  <!-- Dynamic rows will be added here -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Initialize the dashboard functionality
    this.initializeDashboard();
  },

  initializeDashboard() {
    // Wait a moment for DOM to be ready, then initialize
    setTimeout(() => {
      // Re-run the main dashboard code
      initializeJusticeDashboard();
    }, 100);
  }
};

/********** Main Dashboard Initialization **********/
function initializeJusticeDashboard() {
  // DOM Elements
  const fileInput = document.getElementById("fileInput");
  const docInput = document.getElementById("docInput");
  const summarizeBtn = document.getElementById("generateBtn");
  const exportBtn = document.getElementById("exportBtn");
  const askBtn = document.getElementById("askLawGpt");
  const summaryBox = document.getElementById("summaryBox");
  const trackerBody = document.querySelector("#results");

  // Dashboard elements
  const categoryFilter = document.getElementById('categoryFilter');
  const misconductFilter = document.getElementById('misconductFilter');

  // Essential elements check
  if (!summarizeBtn || !trackerBody) {
    console.error('Required DOM elements not found');
    return;
  }

  // Clear old localStorage data on load to refresh with new options
  function clearOldData() {
    const saved = localStorage.getItem("justiceTrackerRows");
    if (saved && saved.includes("CPS Negligence")) {
      localStorage.removeItem("justiceTrackerRows");
      console.log("Cleared old data with outdated misconduct options");
      // Also clear the current table
      if (trackerBody) {
        trackerBody.innerHTML = "";
      }
    }
  }

  // Restore saved data
  (() => {
    clearOldData();
    const saved = localStorage.getItem("justiceTrackerRows");
    if (saved) {
      trackerBody.innerHTML = saved;
      updateDashboardStats();
      populateFilters();
    }
  })();

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
        text += content.items.map(i => i.str).join(" ") + "\n";
      }
      return text.trim();
    } catch (error) {
      console.error('PDF parsing error:', error);
      return `PDF Document: ${file.name} (content extraction failed)`;
    }
  }

  // Text summarizer
  const quickSummary = (text) => {
    const clean = text.replace(/\s+/g, " ").trim();
    return clean.length > 200 ? clean.slice(0, 197) + "…" : clean;
  };

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

  // Child name detector
  function detectChild(text) {
    const children = ["Jace", "Josh"];
    const found = children.filter(name => new RegExp(`\\b${name}\\b`, "i").test(text));
    if (found.length === 2) return "Both";
    if (found.length === 1) return found[0];
    return "Unknown";
  }

  // Save table to localStorage
  function saveTable() {
    localStorage.setItem("justiceTrackerRows", trackerBody.innerHTML);
    updateDashboardStats();
    populateFilters();
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

  // Main summarize button handler
  summarizeBtn.onclick = async () => {
    const hasFile = fileInput?.files?.[0];
    const hasText = docInput?.value?.trim();
    
    if (!hasFile && !hasText) {
      alert("Upload a PDF or paste text first.");
      return;
    }

    let text = hasText || "";
    let fileURL = null;
    let fileName = null;

    if (hasFile) {
      const file = fileInput.files[0];
      fileURL = URL.createObjectURL(file);
      fileName = file.name;
      
      if (!text) {
        text = await pdfToText(file);
      }
    }

    const summary = quickSummary(text);
    if (summaryBox) {
      summaryBox.textContent = summary;
    }
    
    addRow({
      category: detectCategory(text, fileName),
      child: detectChild(text),
      misconduct: "Review Needed",
      summary,
      tags: keywordTags(text),
      fileURL,
      fileName
    });

    if (fileInput) fileInput.value = "";
    if (docInput) docInput.value = "";
    
    alert("Summary added to tracker!");
  };

  // Export to CSV
  if (exportBtn) {
    exportBtn.onclick = () => {
      const headers = Array.from(document.querySelectorAll("#trackerTable thead th") || [])
        .map(th => th.textContent);
      
      const rows = Array.from(trackerBody.querySelectorAll("tr"))
        .map(tr => Array.from(tr.children)
          .map(td => td.innerText.replace(/\n/g, " ").replace(/"/g, '""'))
          .join(","));
      
      const csv = [headers.join(","), ...rows].join("\r\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      
      link.href = URL.createObjectURL(blob);
      link.download = `justice_tracker_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      alert("CSV exported successfully!");
    };
  }

  // Dashboard statistics
  function updateDashboardStats() {
    const rows = Array.from(trackerBody.querySelectorAll('tr'));
    const totalCases = rows.length;
    const activeCases = rows.filter(row => {
      const select = row.querySelector('select');
      return select && select.value !== 'Review Needed';
    }).length;
    
    const totalEl = document.getElementById('totalCases');
    const activeEl = document.getElementById('activeCases');
    
    if (totalEl) totalEl.textContent = totalCases;
    if (activeEl) activeEl.textContent = activeCases;
  }

  // Populate filter dropdowns
  function populateFilters() {
    if (!categoryFilter || !misconductFilter) return;
    
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    misconductFilter.innerHTML = '<option value="">All Types</option>';
    
    const categories = new Set();
    const misconductTypes = new Set();
    
    Array.from(trackerBody.querySelectorAll('tr')).forEach(row => {
      if (row.cells[0]) {
        categories.add(row.cells[0].textContent);
      }
      const select = row.querySelector('select');
      if (select) {
        misconductTypes.add(select.value);
      }
    });
    
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

  // Ask Law GPT (Demo Mode)
  if (askBtn) {
    askBtn.onclick = async () => {
      const prompt = summaryBox?.textContent || "No summary available";
      const analysis = `Law GPT Analysis (Demo Mode):

Based on: "${prompt.slice(0, 100)}..."

Key Legal Issues Identified:
• Potential civil rights violations
• Document evidence preservation needed
• Recommend consulting with attorney
• Consider filing formal complaint

Note: This is a demo. The full version would connect to a legal AI service.`;

      alert(analysis);
    };
  }

  // Initialize dashboard
  updateDashboardStats();
  populateFilters();
}

/********** Initialize Application **********/
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already authenticated
  if (DashboardAuth.checkAuth()) {
    DashboardAuth.loadDashboard();
  } else {
    DashboardAuth.showLoginForm();
  }
});

// Make DashboardAuth globally available
window.DashboardAuth = DashboardAuth;

// Global function to manually clear data (can be called from console)
window.clearJusticeData = function() {
  localStorage.removeItem("justiceTrackerRows");
  location.reload();
};

// Make clearOldData available globally for testing
window.clearOldData = function() {
  const trackerBody = document.querySelector("#results");
  localStorage.removeItem("justiceTrackerRows");
  if (trackerBody) {
    trackerBody.innerHTML = "";
  }
  console.log("Justice tracker data cleared");
};
