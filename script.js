// Justice Dashboard - Authentication & Main App
// Secure authentication with proper session management

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// ===== AUTHENTICATION SYSTEM =====
const DashboardAuth = {
  // State
  isAuthenticated: false,
  currentUser: null,
  authToken: null,

  // Initialize authentication check
  init() {
    return this.checkAuth();
  },

  // Check existing authentication
  checkAuth() {
    const saved = localStorage.getItem('justiceAuth');
    if (saved) {
      try {
        const authData = JSON.parse(saved);
        const isValid = authData.timestamp && 
          (Date.now() - authData.timestamp) < 24 * 60 * 60 * 1000; // 24 hour expiry

        if (isValid && authData.user && authData.token) {
          this.currentUser = authData.user;
          this.authToken = authData.token;
          this.isAuthenticated = true;
          return true;
        } else {
          // Clear expired auth
          this.clearAuth();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        this.clearAuth();
      }
    }
    return false;
  },

  // Authenticate user with server
  async authenticate(username, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();

      if (data.success && data.user && data.token) {
        this.currentUser = data.user;
        this.authToken = data.token;
        this.isAuthenticated = true;
        
        // Store auth info securely with timestamp
        localStorage.setItem('justiceAuth', JSON.stringify({
          user: this.currentUser,
          token: this.authToken,
          timestamp: Date.now()
        }));
        
        return { success: true, user: this.currentUser };
      }
      
      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: error.message };
    }
  },

  // Logout user
  async logout() {
    try {
      // Call server logout endpoint if token exists
      if (this.authToken) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    this.clearAuth();
    this.renderLoginForm();
  },

  // Clear authentication state
  clearAuth() {
    this.currentUser = null;
    this.authToken = null;
    this.isAuthenticated = false;
    localStorage.removeItem('justiceAuth');
  },

  // Render login form
  renderLoginForm() {
    const app = document.getElementById('app');
    if (!app) {
      console.error('App container not found');
      return;
    }

    app.innerHTML = `
      <div class="flex min-h-screen items-center justify-center bg-gray-100">
        <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md space-y-6">
          <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Justice Dashboard</h1>
            <p class="text-gray-600">Secure Legal Document Management</p>
          </div>
          
          <div id="loginError" class="text-red-600 text-sm mb-2 hidden bg-red-50 p-3 rounded border border-red-200"></div>
          
          <form id="loginForm" class="space-y-4">
            <div>
              <label for="loginUsername" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                id="loginUsername" 
                type="text" 
                placeholder="Enter username" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                required
                autofocus />
            </div>
            
            <div>
              <label for="loginPassword" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                id="loginPassword" 
                type="password" 
                placeholder="Enter password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                required />
            </div>
            
            <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              Sign In
            </button>
          </form>
          
          <div class="text-center text-sm text-gray-500">
            <p>Secure access to legal case management</p>
          </div>
        </div>
      </div>
    `;
  },

  // Helper function to make authenticated requests
  async makeAuthenticatedRequest(url, options = {}) {
    if (!DashboardAuth.isAuthenticated) {
      console.error('User not authenticated');
      DashboardAuth.showLoginForm();
      return null;
    }
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${DashboardAuth.authToken}`,
      'Content-Type': 'application/json'
    };
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      if (response.status === 401) {
        // Token expired or invalid
        DashboardAuth.clearAuth();
        DashboardAuth.showLoginForm();
        return null;
      }
      return response;
    } catch (error) {
      console.error('API request error:', error);
      return null;
    }
  },

  // Initialize login form event listeners
  initializeLoginForm() {
    // Add event listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    // Add Enter key support for password field
    const passwordField = document.getElementById('loginPassword');
    if (passwordField) {
      passwordField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleLogin(e);
        }
      });
    }
  },

  // Handle login form submission
  async handleLogin(event) {
    event.preventDefault();
    
    const usernameEl = document.getElementById('loginUsername');
    const passwordEl = document.getElementById('loginPassword');
    const errorEl = document.getElementById('loginError');
    const btnEl = document.getElementById('loginBtn');
    const btnTextEl = document.getElementById('loginBtnText');
    const btnSpinnerEl = document.getElementById('loginBtnSpinner');

    if (!usernameEl || !passwordEl) {
      this.showLoginError('Login form not properly initialized');
      return;
    }

    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    // Basic validation
    if (!username || !password) {
      this.showLoginError('Please enter both username and password');
      return;
    }

    // Show loading state
    btnEl.disabled = true;
    btnTextEl.classList.add('hidden');
    btnSpinnerEl.classList.remove('hidden');
    errorEl.classList.add('hidden');

    try {
      const result = await this.authenticate(username, password);
      
      if (result.success) {
        // Success - redirect to dashboard
        this.renderDashboard();
      } else {
        this.showLoginError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showLoginError('Connection error. Please check your network and try again.');
    } finally {
      // Reset button state
      btnEl.disabled = false;
      btnTextEl.classList.remove('hidden');
      btnSpinnerEl.classList.add('hidden');
    }
  },

  // Show login error message
  showLoginError(message) {
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        errorEl.classList.add('hidden');
      }, 5000);
    }
  },

  // Render main dashboard
  renderDashboard() {
    const app = document.getElementById('app');
    if (!app) {
      console.error('App container not found');
      return;
    }

    // Initialize the main dashboard content
    initializeJusticeDashboard();
  },

  showLoginForm() {
    console.log('showLoginForm() called');
    // Use the existing app div instead of replacing the entire body
    const appDiv = document.getElementById('app');
    console.log('App div found in showLoginForm?', !!appDiv);
    
    if (!appDiv) {
      console.error('App div not found for login form');
      console.log('Available elements with IDs:', 
        Array.from(document.querySelectorAll('[id]')).map(el => el.id));
      return;
    }

    appDiv.innerHTML = `
      <div class="min-h-screen bg-gray-100 flex items-center justify-center">
        <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Justice Dashboard</h1>
            <p class="text-gray-600 mt-2">Secure Access Portal</p>
          </div>
          
          <form id="loginForm" class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" id="username" name="username" required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" id="password" name="password" required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div id="loginError" class="hidden text-red-600 text-sm bg-red-50 p-2 rounded"></div>
            
            <button type="submit" id="loginBtn" 
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Access Dashboard
            </button>
          </form>
          
          <div class="mt-6 text-center text-sm text-gray-500">
            <p>Secure Justice Management System</p>
          </div>
        </div>
      </div>
    `;

    // Initialize login form functionality
    setTimeout(() => {
      const loginForm = document.getElementById('loginForm');
      const loginBtn = document.getElementById('loginBtn');
      const errorDiv = document.getElementById('loginError');

      if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const username = document.getElementById('username').value.trim();
          const password = document.getElementById('password').value;
          
          if (!username || !password) {
            errorDiv.textContent = 'Please enter both username and password';
            errorDiv.classList.remove('hidden');
            return;
          }
          
          // Clear previous errors
          errorDiv.classList.add('hidden');
          
          // Update button state
          loginBtn.textContent = 'Authenticating...';
          loginBtn.disabled = true;
          
          try {
            const result = await this.authenticate(username, password);
            
            if (result.success) {
              this.loadDashboard();
            } else {
              errorDiv.textContent = result.error || 'Invalid username or password';
              errorDiv.classList.remove('hidden');
            }
          } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Connection error. Please try again.';
            errorDiv.classList.remove('hidden');
          } finally {
            // Reset button state
            loginBtn.textContent = 'Access Dashboard';
            loginBtn.disabled = false;
          }
        });
      }
    }, 100);
  },

  loadDashboard() {
    // Instead of replacing the entire body, just replace the app div content
    const appDiv = document.getElementById('app');
    if (!appDiv) {
      console.error('App div not found');
      return;
    }

    // CSP-compliant dashboard content (no inline scripts or external CDNs)
    appDiv.innerHTML = `
      <!-- Header with user info and logout -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 class="text-xl font-bold text-gray-900">Justice Dashboard</h1>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">Welcome, ${this.currentUser.fullName || this.currentUser.username}</span>
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${this.currentUser.role}</span>
            <button id="logoutBtn" class="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
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
              <input type="file" id="fileInput" accept=".pdf" multiple
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <small class="text-gray-600">Select multiple PDF files for bulk processing</small>
            </div>
            
            <!-- Progress bar for bulk processing -->
            <div id="bulkProgress" class="hidden">
              <div class="bg-gray-200 rounded-full h-2.5 mb-2">
                <div id="progressBar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-300 progress-0"></div>
              </div>
              <p id="progressText" class="text-sm text-gray-600">Processing 0 of 0 files...</p>
            </div>
            
            <div class="flex space-x-4">
              <button id="generateBtn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Process Selected Files
              </button>
              <button id="bulkProcessBtn" class="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                Bulk Process (Skip Duplicates)
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
    `;

    // Initialize the dashboard functionality without inline scripts
    this.initializeDashboard();
  },

  initializeDashboard() {
    // Wait a moment for DOM to be ready, then initialize
    setTimeout(() => {
      // Add logout event listener
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.logout();
        });
      }
      
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
  let trackerBody = document.querySelector("#results");
  
  // Fallback for trackerBody
  if (!trackerBody) {
    trackerBody = document.querySelector("#trackerTable tbody");
  }
  if (!trackerBody) {
    console.error('Could not find tracker table body');
    return;
  }

  // Dashboard elements
  const categoryFilter = document.getElementById('categoryFilter');
  const misconductFilter = document.getElementById('misconductFilter');

  // Essential elements check
  if (!summarizeBtn || !trackerBody) {
    console.error('Required DOM elements not found');
    console.log('Available elements:');
    console.log('summarizeBtn:', summarizeBtn);
    console.log('trackerBody:', trackerBody);
    console.log('fileInput:', fileInput);
    console.log('Available IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    return;
  }

  console.log('All essential elements found, initializing dashboard...');

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

  // Check for duplicates based on file name and summary (optimized for bulk)
  function isDuplicate(fileName, summary) {
    // Quick cache for performance
    if (!window.summaryCache) {
      window.summaryCache = new Set();
      // Build initial cache
      const existingRows = Array.from(trackerBody.querySelectorAll('tr'));
      for (const row of existingRows) {
        const cells = row.cells;
        if (cells && cells.length >= 4) {
          window.summaryCache.add(cells[3].textContent.trim());
        }
      }
    }
    
    const trimmedSummary = summary.trim();
    
    // Fast exact match check
    if (window.summaryCache.has(trimmedSummary)) {
      return { isDupe: true, reason: 'Identical summary content' };
    }
    
    // For bulk operations, skip expensive similarity checks
    if (isProcessingBulk) {
      // Add to cache for future checks
      window.summaryCache.add(trimmedSummary);
      return { isDupe: false };
    }
    
    // Expensive similarity check only for individual files
    const existingRows = Array.from(trackerBody.querySelectorAll('tr'));
    
    for (const row of existingRows) {
      const cells = row.cells;
      if (!cells || cells.length < 4) continue;
      
      const existingSummary = cells[3].textContent.trim();
      
      // Check for same filename if provided
      if (fileName && existingSummary.length > 10 && summary.length > 10) {
        const similarity = calculateSimilarity(existingSummary, summary);
        if (similarity > 0.85) { // 85% similar
          return { isDupe: true, reason: `${Math.round(similarity * 100)}% similar content` };
        }
      }
    }
    
    // Add to cache
    window.summaryCache.add(trimmedSummary);
    return { isDupe: false };
  }

  // Calculate text similarity (basic implementation)
  function calculateSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    if (words1.length === 0 && words2.length === 0) return 1;
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return commonWords.length / totalWords;
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

  // Silent version of addRow (no alerts)
  function addRowSilent({ category, child, misconduct, summary, tags, fileURL, fileName }) {
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
    
    // Save to localStorage (batch save for performance)
    if (bulkProgress % 10 === 0 || bulkProgress === bulkTotal) {
      saveTable();
    }
  }

  // Optimize saving for bulk operations
  let saveTimeout;
  function saveTableDelayed() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveTable();
    }, 1000); // Save after 1 second of no activity
  }

  // Main summarize button handler
  summarizeBtn.onclick = async () => {
    const files = fileInput?.files;
    const hasText = docInput?.value?.trim();
    
    if (!files?.length && !hasText) {
      alert("Upload PDF files or paste text first.");
      return;
    }
    
    // Handle multiple files
    if (files?.length > 1) {
      const proceed = confirm(
        `You've selected ${files.length} files.\n\n` +
        `Process all files? This may take a while.`
      );
      
      if (proceed) {
        await processBulkFiles(Array.from(files), false);
        return;
      } else {
        return;
      }
    }
    
    // Handle single file or text (original logic)
    const hasFile = files?.[0];
    
    if (!hasFile && !hasText) {
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
    
    // Check for duplicates before adding
    const dupeCheck = isDuplicate(fileName, summary);
    if (dupeCheck.isDupe) {
      const userConfirm = confirm(
        `⚠️ Potential duplicate detected!\n\n` +
        `Reason: ${dupeCheck.reason}\n\n` +
        `Do you want to add this document anyway?`
      );
      
      if (!userConfirm) {
        alert("Document not added - duplicate detected.");
        if (fileInput) fileInput.value = "";
        if (docInput) docInput.value = "";
        return;
      }
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

  // Bulk processing function
  async function processBulkFiles(files, skipDuplicates = false) {
    isProcessingBulk = true;
    bulkTotal = files.length;
    bulkProgress = 0;
    
    const progressDiv = document.getElementById('bulkProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressDiv.classList.remove('hidden');
    
    let processedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      bulkProgress = i + 1;
      
      // Update progress using CSS classes (CSP-compliant)
      const percentage = (bulkProgress / bulkTotal) * 100;
      const progressClass = `progress-${Math.round(percentage / 5) * 5}`;
      
      // Remove existing progress classes
      progressBar.className = progressBar.className.replace(/progress-\d+/g, '');
      // Add new progress class
      progressBar.classList.add(progressClass);
      
      progressText.textContent = `Processing ${bulkProgress} of ${bulkTotal} files... (${file.name})`;
      
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
        addRowSilent({
          category: detectCategory(text, file.name),
          child: detectChild(text),
          misconduct: "Review Needed",
          summary,
          tags: keywordTags(text),
          fileURL,
          fileName: file.name
        });
        
        processedCount++;
        
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        errorCount++;
      }
    }
    
    // Hide progress and show results
    progressDiv.classList.add('hidden');
    isProcessingBulk = false;
    
    alert(
      `Bulk processing complete!\n\n` +
      `✅ Processed: ${processedCount} files\n` +
      `⚠️ Duplicates skipped: ${duplicateCount}\n` +
      `❌ Errors: ${errorCount}\n` +
      `📊 Total: ${bulkTotal} files`
    );
  }

  // Bulk process button handler
  const bulkProcessBtn = document.getElementById("bulkProcessBtn");
  if (bulkProcessBtn) {
    bulkProcessBtn.onclick = async () => {
      const files = fileInput?.files;
      
      if (!files?.length) {
        alert("Please select PDF files first.");
        return;
      }
      
      const proceed = confirm(
        `Bulk process ${files.length} files?\n\n` +
        `• Duplicates will be automatically skipped\n` +
        `• Processing may take several minutes\n` +
        `• Don't close the browser while processing`
      );
      
      if (proceed) {
        await processBulkFiles(Array.from(files), true);
      }
    };
  }

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
  console.log('DOM loaded, checking authentication...');
  
  // Check if user is already authenticated
  if (DashboardAuth.checkAuth()) {
    console.log('User authenticated, loading dashboard...');
    DashboardAuth.loadDashboard();
  } else {
    console.log('User not authenticated, showing login form...');
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

// Global debugging functions
window.debugDashboard = function() {
  console.log('=== Dashboard Debug Info ===');
  console.log('Authentication:', {
    isAuthenticated: DashboardAuth.isAuthenticated,
    user: DashboardAuth.currentUser,
    token: DashboardAuth.authToken ? 'Present' : 'Missing'
  });
  console.log('DOM elements:', {
    fileInput: document.getElementById("fileInput"),
    generateBtn: document.getElementById("generateBtn"),
    results: document.querySelector("#results"),
    trackerTable: document.getElementById("trackerTable")
  });
  console.log('All elements with IDs:', 
    Array.from(document.querySelectorAll('[id]')).map(el => el.id)
  );
};

// ===== MAIN APP INITIALIZATION =====
function initializeApp() {
  console.log('Justice Dashboard starting...');
  
  // Check if app container exists
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('App container (#app) not found in DOM');
    return;
  }

  // Initialize authentication and render appropriate view
  if (DashboardAuth.init()) {
    // User is authenticated - show dashboard
    console.log('User authenticated, loading dashboard...');
    DashboardAuth.renderDashboard();
  } else {
    // User not authenticated - show login form
    console.log('User not authenticated, showing login form...');
    DashboardAuth.renderLoginForm();
  }
}

// Helper function to check if user is authenticated (for use in other parts of app)
function isUserAuthenticated() {
  return DashboardAuth.isAuthenticated;
}

// Helper function to get current user info (for use in other parts of app)
function getCurrentUser() {
  return DashboardAuth.currentUser;
}

// Helper function to get auth token for API calls
function getAuthToken() {
  return DashboardAuth.authToken;
}

// Helper function to logout (for use in UI)
function logoutUser() {
  DashboardAuth.logout();
}

// Export auth functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DashboardAuth,
    initializeApp,
    isUserAuthenticated,
    getCurrentUser,
    getAuthToken,
    logoutUser
  };
}

// API Helper Functions for Authenticated Requests
const ApiHelper = {
  // Make authenticated API requests
  async makeRequest(url, options = {}) {
    const authToken = getAuthToken();
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      ...options
    };
    
    // Merge headers if provided
    if (options.headers) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        ...options.headers
      };
    }
    
    try {
      const response = await fetch(url, defaultOptions);
      
      // Handle unauthorized responses
      if (response.status === 401) {
        DashboardAuth.logout();
        throw new Error('Session expired. Please log in again.');
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  
  // Upload file with authentication
  async uploadFile(file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const authToken = getAuthToken();
    return this.makeRequest('/api/summarize', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      }
    });
  },
  
  // Get user profile
  async getProfile() {
    const response = await this.makeRequest('/api/profile');
    return response.json();
  },
  
  // Admin: Get all users
  async getUsers() {
    const response = await this.makeRequest('/api/admin/users');
    return response.json();
  },
  
  // Admin: Add user
  async addUser(userData) {
    const response = await this.makeRequest('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return response.json();
  },
  
  // Admin: Delete user
  async deleteUser(userId) {
    const response = await this.makeRequest(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};
