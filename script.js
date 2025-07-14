// Justice Dashboard - Authentication & Main App
// Secure authentication with proper session management

// PDF.js Status Check
document.addEventListener('DOMContentLoaded', () => {
  if (typeof pdfjsLib !== 'undefined') {
    console.log('✅ PDF.js library loaded successfully');
    console.log('📚 PDF.js version:', pdfjsLib.version);
  } else {
    console.error('❌ PDF.js library not found - PDF content extraction will not work');
  }
});

// Environment detection helper
function getApiBaseUrl() {
  // If API_BASE_URL is defined globally (from index.html), use it
  if (typeof window.API_BASE_URL !== 'undefined') {
    return window.API_BASE_URL;
  }
  
  // Fallback: Check if running locally
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname === '';
  
  // Return appropriate base URL
  return isLocal ? "http://localhost:3000" : "https://justice-dashboard.onrender.com";
}

// Use dynamic API base URL (will use window.API_BASE_URL when available)
const DYNAMIC_API_BASE_URL = getApiBaseUrl();

// Global variables for bulk processing
let isProcessingBulk = false;
let bulkTotal = 0;
let bulkProgress = 0;

// Global debug flag
const JUSTICE_DEBUG = true; // Set to false to disable debug logs

function justiceDebugLog(...args) {
  if (JUSTICE_DEBUG) {
    console.log('[JusticeDashboard]', ...args);
  }
}

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
      const response = await fetch(`${DYNAMIC_API_BASE_URL}/api/login`, {
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
        await fetch(`${DYNAMIC_API_BASE_URL}/api/logout`, {
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
      const response = await fetch(`${DYNAMIC_API_BASE_URL}${url}`, {
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

    // Show the dashboard content that's already in the HTML
    const loadingScreen = document.getElementById('loadingScreen');
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
    
    if (dashboardContent) {
      dashboardContent.classList.remove('hidden');
      
      // Initialize dashboard functionality only after content is visible
      setTimeout(() => {
        initializeJusticeDashboard();
      }, 50);
    } else {
      console.error('Dashboard content container not found');
    }
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
            <!-- Action Buttons Row -->
            <div class="flex flex-wrap gap-4 justify-center">
              <button id="generateBtn" class="justice-btn-primary bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium text-base px-6 py-3 shadow-lg">
                🤖 Process Selected Files
              </button>
              <button id="bulkProcessBtn" class="justice-btn-secondary bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 transition-all duration-200 font-medium text-base px-6 py-3 shadow-lg">
                📚 Bulk Process (Skip Duplicates)
              </button>
              <button id="exportBtn" class="justice-btn-accent bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition-all duration-200 font-medium text-base px-6 py-3 shadow-lg">
                📊 Export CSV
              </button>
              <button id="askWolfram" class="justice-btn-primary bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 font-medium text-base px-6 py-3 shadow-lg">
                🧠 Ask Wolfram Alpha
              </button>
            </div>
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
                  <th class="border border-gray-300 p-2">Enhanced Summary</th>
                  <th class="border border-gray-300 p-2">File Name</th>
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

/********** Dashboard Statistics Functions **********/
function updateDashboardStats() {
  // Get all tracker rows to calculate statistics
  const trackerBody = document.querySelector("#results");
  const rows = trackerBody ? trackerBody.querySelectorAll('tr') : [];
  
  // Calculate total cases
  const totalCases = rows.length;
  
  // Calculate active cases and PDF statistics
  let activeCases = 0;
  let documentsProcessed = 0;
  let pdfDocuments = 0;
  let totalPdfCharacters = 0;
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 4) {
      // Check status column (assuming it's in the 4th column)
      const status = cells[3].textContent.trim().toLowerCase();
      if (status !== 'closed' && status !== 'complete' && status !== 'resolved') {
        activeCases++;
      }
      
      // Count documents and analyze PDF content
      const fileLinks = row.querySelectorAll('a[href*="blob:"]');
      documentsProcessed += fileLinks.length;
      
      // Check for PDF documents and count characters
      fileLinks.forEach(link => {
        if (link.textContent.toLowerCase().includes('.pdf')) {
          pdfDocuments++;
          // Try to estimate content from visible text in the row
          const rowText = row.textContent;
          if (rowText.length > 200) { // Likely contains extracted PDF content
            totalPdfCharacters += rowText.length;
          }
        }
      });
    }
  });
  
  // Update dashboard stat elements
  const totalCasesEl = document.getElementById('totalCases');
  const activeCasesEl = document.getElementById('activeCases');
  const documentsProcessedEl = document.getElementById('documentsProcessed');
  const systemStatusEl = document.getElementById('systemStatus');
  
  if (totalCasesEl) totalCasesEl.textContent = totalCases;
  if (activeCasesEl) activeCasesEl.textContent = activeCases;
  if (documentsProcessedEl) documentsProcessedEl.textContent = documentsProcessed;
  if (systemStatusEl) systemStatusEl.textContent = totalCases > 0 ? 'Active' : 'Ready';
  
  // Update PDF-specific stats if elements exist
  const pdfDocumentsEl = document.getElementById('pdfDocuments');
  const pdfCharactersEl = document.getElementById('pdfCharacters');
  
  if (pdfDocumentsEl) pdfDocumentsEl.textContent = pdfDocuments;
  if (pdfCharactersEl) pdfCharactersEl.textContent = `${(totalPdfCharacters / 1000).toFixed(1)}K`;
  
  console.log(`📊 Dashboard stats updated: ${totalCases} total, ${activeCases} active, ${documentsProcessed} documents, ${pdfDocuments} PDFs (${totalPdfCharacters} chars)`);
}

function updateNoCasesDisplay() {
  // Reset all stats to 0 when no cases exist
  const totalCasesEl = document.getElementById('totalCases');
  const activeCasesEl = document.getElementById('activeCases');
  const documentsProcessedEl = document.getElementById('documentsProcessed');
  const systemStatusEl = document.getElementById('systemStatus');
  
  if (totalCasesEl) totalCasesEl.textContent = '0';
  if (activeCasesEl) activeCasesEl.textContent = '0';
  if (documentsProcessedEl) documentsProcessedEl.textContent = '0';
  if (systemStatusEl) systemStatusEl.textContent = 'Ready';
}

/********** Filter Functions **********/
function populateFilters() {
  // Get all tracker rows to read existing data
  const trackerBody = document.querySelector("#results");
  const rows = trackerBody ? trackerBody.querySelectorAll('tr') : [];
  
  // Get filter elements
  const categoryFilter = document.getElementById('categoryFilter');
  const misconductFilter = document.getElementById('misconductFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');
  
  // Collect unique values from existing data
  const categories = new Set();
  const misconductTypes = new Set();
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 3) {
      // Category is in first column
      const category = cells[0].textContent.trim();
      if (category) categories.add(category);
      
      // Misconduct type is in third column (misconduct select)
      const misconductSelect = cells[2].querySelector('select');
      if (misconductSelect && misconductSelect.value) {
        misconductTypes.add(misconductSelect.value);
      }
    }
  });
  
  // Populate category filter (keep existing static options + dynamic ones)
  if (categoryFilter) {
    const staticOptions = categoryFilter.innerHTML;
    const dynamicOptions = Array.from(categories)
      .filter(cat => !staticOptions.includes(cat)) // Don't duplicate existing options
      .map(cat => `<option value="${cat}">${cat}</option>`)
      .join('');
    
    if (dynamicOptions) {
      categoryFilter.innerHTML = staticOptions + dynamicOptions;
    }
  }
  
  // Populate misconduct filter (keep existing static options + dynamic ones)
  if (misconductFilter) {
    const staticOptions = misconductFilter.innerHTML;
    const dynamicOptions = Array.from(misconductTypes)
      .filter(type => !staticOptions.includes(type)) // Don't duplicate existing options
      .map(type => `<option value="${type}">${type}</option>`)
      .join('');
    
    if (dynamicOptions) {
      misconductFilter.innerHTML = staticOptions + dynamicOptions;
    }
  }
  
  // Set up filter event handlers
  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFilters);
  }
  
  if (misconductFilter) {
    misconductFilter.addEventListener('change', applyFilters);
  }
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearAllFilters);
  }
}

function applyFilters() {
  const trackerBody = document.querySelector("#results");
  const rows = trackerBody ? trackerBody.querySelectorAll('tr') : [];
  
  const categoryFilter = document.getElementById('categoryFilter');
  const misconductFilter = document.getElementById('misconductFilter');
  
  const selectedCategory = categoryFilter ? categoryFilter.value : '';
  const selectedMisconduct = misconductFilter ? misconductFilter.value : '';
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 3) {
      const category = cells[0].textContent.trim();
      const misconductSelect = cells[2].querySelector('select');
      const misconduct = misconductSelect ? misconductSelect.value : '';
      
      const categoryMatch = !selectedCategory || category === selectedCategory;
      const misconductMatch = !selectedMisconduct || misconduct === selectedMisconduct;
      
      // Show/hide row based on filter matches
      row.style.display = (categoryMatch && misconductMatch) ? '' : 'none';
    }
  });
  
  // Update stats after filtering
  updateDashboardStats();
}

function clearAllFilters() {
  const categoryFilter = document.getElementById('categoryFilter');
  const misconductFilter = document.getElementById('misconductFilter');
  
  if (categoryFilter) categoryFilter.value = '';
  if (misconductFilter) misconductFilter.value = '';
  
  // Show all rows
  const trackerBody = document.querySelector("#results");
  const rows = trackerBody ? trackerBody.querySelectorAll('tr') : [];
  rows.forEach(row => {
    row.style.display = '';
  });
  
  // Update stats
  updateDashboardStats();
}

/********** Main Dashboard Initialization **********/
function initializeJusticeDashboard() {
  // Timeout variable for optimized saving
  // let saveTimeout; // FIXED: Using declaration from function start
  
  // DOM Elements
  const fileInput = document.getElementById("fileInput");
  const docInput = document.getElementById("docInput");
  const summarizeBtn = document.getElementById("generateBtn");
  const exportBtn = document.getElementById("exportBtn");
  const askBtn = document.getElementById("askWolfram");
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
  const textInput = document.getElementById('textInput');
  const askWolframBtn = document.getElementById('askWolfram');

  // Wire up Ask Wolfram Alpha button
  if (askWolframBtn) {
    askWolframBtn.addEventListener('click', async () => {
      const query = prompt("What legal or factual question would you like to ask Wolfram Alpha?\n\nExample: 'What is the constitutional standard for removal of a child from parental custody in Michigan?'");
      if (!query || !query.trim()) return;
      
      try {
        askWolframBtn.disabled = true;
        askWolframBtn.innerHTML = '🔄 Asking Wolfram...';
        
        const result = await askWolfram(query.trim());
        
        // Display result in a modal or alert
        showWolframResult(query, result);
        
      } catch (error) {
        console.error('Wolfram Alpha error:', error);
        showNotification('Error: ' + error.message, 'error');
      } finally {
        askWolframBtn.disabled = false;
        askWolframBtn.innerHTML = '🧠 Ask Wolfram Alpha';
      }
    });
  }
  const categoryFilter = document.getElementById('categoryFilter');
  const misconductFilter = document.getElementById('misconductFilter');

  // Daily Prayer Persistence
  const dailyPrayer = document.getElementById('dailyPrayer');
  if (dailyPrayer) {
    // Restore saved prayer
    const savedPrayer = localStorage.getItem('dailyPrayerText');
    if (savedPrayer) dailyPrayer.value = savedPrayer;
    // Save on input
    dailyPrayer.addEventListener('input', () => {
      localStorage.setItem('dailyPrayerText', dailyPrayer.value);
    });
  }

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
    } else {
      // Show no cases message initially
      updateNoCasesDisplay();
    }
  })();

  // PDF to text converter
  async function pdfToText(file) {
    try {
      // Debug: Check all possible PDF.js references
      console.log('=== PDF.js Debug Info ===');
      console.log('typeof pdfjsLib:', typeof pdfjsLib);
      console.log('typeof window.pdfjsLib:', typeof window.pdfjsLib);
      console.log('pdfjsLib:', pdfjsLib);
      console.log('window.pdfjsLib:', window.pdfjsLib);
      
      // Try to get PDF.js from different scopes
      const pdfLib = (typeof pdfjsLib !== 'undefined') ? pdfjsLib : 
                     (typeof window.pdfjsLib !== 'undefined') ? window.pdfjsLib :
                     (typeof window.pdfjsLib !== 'undefined') ? window.pdfjsLib : null;
      
      console.log('pdfLib resolved to:', pdfLib);
      console.log('pdfLib version:', pdfLib?.version);
      
      // Check if PDF.js is available
      if (!pdfLib) {
        console.error('❌ PDF.js library not loaded. Cannot extract PDF content.');
        return `PDF Document: ${file.name}\n\n[Content extraction failed: PDF.js library not loaded]\n\nNote: Only filename was captured. Please ensure PDF.js is properly loaded for content extraction.`;
      }

      console.log(`📄 Extracting text from PDF: ${file.name}`);
      
      const buffer = await file.arrayBuffer();
      const pdf = await pdfLib.getDocument({ data: buffer }).promise;
      let text = "";
      
      console.log(`📖 Processing ${pdf.numPages} pages...`);
      
      let summaryArr = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ').trim();
        if (pageText && pageText.replace(/\s+/g, '').length > 10) {
          summaryArr.push(pageText);
        }
      }
      const extractedText = summaryArr.join('\n\n');
      if (extractedText.length === 0) {
        console.warn(`⚠️ No text content found in PDF: ${file.name}`);
        return `PDF Document: ${file.name}`;
      }
      // Optionally truncate to 1000 chars for summary display
      const summaryText = extractedText.length > 1000 ? extractedText.substring(0, 1000) + '...' : extractedText;
      console.log(`✅ Successfully extracted ${extractedText.length} characters from ${file.name}`);
      // Show success notification to user
      showNotification(`📄 PDF processed: ${file.name} (${extractedText.length} characters extracted)`, 'success');
      return summaryText;
      
    } catch (error) {
      console.error('❌ PDF parsing error:', error);
      return `PDF Document: ${file.name}\n\n[Content extraction failed: ${error.message}]\n\nThe file may be corrupted, password-protected, or in an unsupported format.`;
    }
  }

  // Text summarizer
  const quickSummary = (text) => {
    const clean = text.replace(/\s+/g, " ").trim();
    return clean.length > 200 ? clean.slice(0, 197) + "…" : clean;
  };

  // Ensure summary logic only uses main document textarea (never Personal Notes)
  function getDocumentInputText() {
    const mainInput = document.getElementById('textInput') || document.getElementById('docInput') || document.getElementById('docText');
    return mainInput ? mainInput.value : '';
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
    updateNoCasesDisplay();
  }

  // Update the no cases display
  function updateNoCasesDisplay() {
    const rows = Array.from(trackerBody.querySelectorAll('tr'));
    const noCasesMsg = document.getElementById('noCasesMsg');
    
    if (rows.length === 0) {
      if (noCasesMsg) {
        noCasesMsg.classList.remove('hidden');
      }
    } else {
      if (noCasesMsg) {
        noCasesMsg.classList.add('hidden');
      }
    }
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

  // Helper function to get category icon
  function getCategoryIcon(category) {
    const icons = {
      'Medical': '🏥',
      'Legal': '⚖️',
      'School': '🏫',
      'General': '📝'
    };
    return icons[category] || '📄';
  }

  // Add row to tracker with enhanced styling
  function addRow({ category, child, misconduct, summary, tags, fileURL, fileName }) {
    const row = trackerBody.insertRow();
    row.className = "hover:bg-indigo-50 transition-all duration-200 group";
    
    // Category cell with icon
    const categoryCell = row.insertCell();
    categoryCell.className = "py-4 px-6 text-sm font-medium text-gray-900";
    const categoryIcon = getCategoryIcon(category);
    categoryCell.innerHTML = `<span class="flex items-center"><span class="mr-2">${categoryIcon}</span>${category}</span>`;
    
    // Child cell
    const childCell = row.insertCell();
    childCell.className = "py-4 px-6 text-sm text-gray-700";
    childCell.textContent = child;
    
    // Misconduct cell with enhanced select
    const misconductCell = row.insertCell();
    misconductCell.className = "py-4 px-6";
    const select = buildMisconductSelect(misconduct);
    select.className = "w-full bg-transparent text-sm border border-gray-200 rounded-md px-2 py-1 hover:border-indigo-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all";
    misconductCell.appendChild(select);
    
    // Summary cell with expand functionality
    const summaryCell = row.insertCell();
    summaryCell.className = "py-4 px-6 text-sm text-gray-700 min-w-[300px]";
    const truncatedSummary = summary.length > 100 ? summary.slice(0, 97) + "..." : summary;
    summaryCell.innerHTML = `
      <div class="relative">
        <p class="summary-text cursor-pointer hover:text-indigo-600 transition-colors" title="Click to expand">
          ${truncatedSummary}
        </p>
        <div class="summary-full hidden absolute z-10 bg-white border border-gray-300 rounded-lg p-3 shadow-lg max-w-md mt-1">
          <p class="text-sm text-gray-700 leading-relaxed">${summary}</p>
          <button class="mt-2 text-xs text-indigo-600 hover:text-indigo-800">Close</button>
        </div>
      </div>
    `;
    
    // Add click handlers for summary expansion
    const summaryText = summaryCell.querySelector('.summary-text');
    const summaryFull = summaryCell.querySelector('.summary-full');
    const closeBtn = summaryCell.querySelector('.summary-full button');
    
    summaryText.addEventListener('click', () => {
      summaryFull.classList.toggle('hidden');
    });
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      summaryFull.classList.add('hidden');
    });
    
    // File Name cell (NEW!)
    const fileNameCell = row.insertCell();
    fileNameCell.className = "py-4 px-6 text-sm text-gray-700";
    fileNameCell.textContent = fileName || '';
    
    // Tags cell with colored badges
    const tagsCell = row.insertCell();
    tagsCell.className = "py-4 px-6 text-sm";
    if (tags && tags.length > 0) {
      tagsCell.innerHTML = tags.map(tag => 
        `<span class="inline-block bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1 border border-blue-200">${tag}</span>`
      ).join('');
    } else {
      tagsCell.innerHTML = '<span class="text-gray-400 italic">None</span>';
    }
    
    // Actions cell with enhanced buttons
    const actionCell = row.insertCell();
    actionCell.className = "py-4 px-6";
    if (fileURL) {
      actionCell.innerHTML = `
        <div class="flex space-x-2">
          <button onclick="window.open('${fileURL}', '_blank')" 
                  class="px-3 py-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-md text-xs hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md">
            <span class="mr-1">👁️</span>View
          </button>
          <button onclick="this.closest('tr').remove(); saveTable();" 
                  class="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md text-xs hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow-md">
            <span class="mr-1">🗑️</span>Delete
          </button>
        </div>
      `;
    } else {
      actionCell.innerHTML = `
        <div class="flex space-x-2">
          <span class="text-gray-400 text-xs italic">No file</span>
          <button onclick="this.closest('tr').remove(); saveTable();" 
                  class="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md text-xs hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow-md">
            <span class="mr-1">🗑️</span>Delete
          </button>
        </div>
      `;
    }
    
    saveTable();
    updateLastUpdated();
  }

  // Silent version of addRow (no alerts)
  function addRowSilent({ category, child, misconduct, summary, tags, fileURL, fileName }) {
    const row = trackerBody.insertRow();

    // Category column
    row.insertCell().innerText = category;

    // Child column
    row.insertCell().innerText = child;

    // Misconduct column
    row.insertCell().appendChild(buildMisconductSelect(misconduct));

    // Enhanced Summary column
    const summaryCell = row.insertCell();
    summaryCell.textContent = summary;
    summaryCell.title = summary;
    summaryCell.className = "max-w-xs truncate";
    summaryCell.setAttribute('data-label', 'Enhanced Summary');

    // File Name column
    const fileNameCell = row.insertCell();
    fileNameCell.className = "py-4 px-6 text-sm text-gray-700";
    fileNameCell.textContent = fileName || '';
    fileNameCell.setAttribute('data-label', 'File Name');

    // Tags column
    row.insertCell().innerText = tags && tags.length ? tags.join(", ") : "";

    // Action column (View PDF hyperlink or No PDF)
    const actionCell = row.insertCell();
    if (fileURL) {
      const viewLink = document.createElement("a");
      viewLink.innerText = "View PDF";
      viewLink.href = fileURL;
      viewLink.target = "_blank";
      viewLink.className = "text-blue-600 underline text-sm hover:text-blue-800";
      actionCell.appendChild(viewLink);
    } else {
      actionCell.innerText = "No PDF";
      actionCell.className = "text-gray-400 text-sm";
    }

    // Save to localStorage (batch save for performance)
    if (typeof bulkProgress !== "undefined" && (bulkProgress % 10 === 0 || bulkProgress === bulkTotal)) {
      saveTable();
    }
  }

  // Optimize saving for bulk operations
  // let saveTimeout; // FIXED: Using declaration from function start
  function saveTableDelayed() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveTable();
    }, 1000); // Save after 1 second of no activity
  }

  // Main summarize button handler
  summarizeBtn.onclick = async () => {
  justiceDebugLog('summarizeBtn clicked');
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
    if (!files || files.length === 0) return;

    justiceDebugLog('processBulkFiles called', { fileCount: files.length, skipDuplicates });
    
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
      
      justiceDebugLog(`Processing file [${i+1}/${files.length}]`, file?.name);

      // Update progress display
      if (progressBar && progressText) {
        const percentage = (bulkProgress / bulkTotal) * 100;
        const progressClass = `progress-${Math.round(percentage / 5) * 5}`;
        
        // Remove existing progress classes and add new one
        progressBar.className = progressBar.className.replace(/progress-\d+/g, '');
        progressBar.classList.add(progressClass);
        progressText.textContent = `Processing ${bulkProgress} of ${bulkTotal} files... (${file.name})`;
      }

      try {
        // Ensure file is a PDF
        if (file.type !== 'application/pdf') {
          showNotification('Only PDF files are supported: ' + file.name, 'error');
          errorCount++;
          continue;
        }

        // Add delay to prevent browser freezing
        await new Promise(resolve => setTimeout(resolve, 50));

        // Process the PDF
        const text = await pdfToText(file);
        const summary = quickSummary(text);
        const fileURL = URL.createObjectURL(file);

        // Check for duplicates if requested
        if (skipDuplicates) {
          const dupeCheck = isDuplicate(file.name, summary);
          if (dupeCheck.isDupe) {
            justiceDebugLog(`Duplicate skipped: ${file.name}`);
            duplicateCount++;
            continue;
          }
        }

        // Compose row data for tracker
        const rowData = {
          category: detectCategory(text, file.name),
          child: detectChild(text),
          misconduct: "Review Needed",
          summary: summary || '',
          tags: keywordTags(text),
          fileURL: fileURL,
          fileName: file.name || ''
        };

        // Add row to tracker
        addRowSilent(rowData);
        justiceDebugLog(`File processed and added: ${file.name}`);
        processedCount++;

      } catch (error) {
        justiceDebugLog(`Error processing file: ${file.name}`, error);
        showNotification('Failed to process: ' + (file.name || 'Unknown file'), 'error');
        errorCount++;
      }
    }

    // Hide progress and show results
    if (progressDiv) progressDiv.classList.add('hidden');
    isProcessingBulk = false;

    justiceDebugLog('Bulk processing complete', {
      processedCount,
      duplicateCount,
      errorCount,
      total: bulkTotal
    });

    // Show completion notification
    const message = `Bulk processing complete!\n\n` +
      `✅ Processed: ${processedCount} files\n` +
      `⚠️ Duplicates skipped: ${duplicateCount}\n` +
      `❌ Errors: ${errorCount}\n` +
      `📊 Total: ${bulkTotal} files`;
    
    showNotification(message, processedCount > 0 ? 'success' : 'warning');
  }

  // Bulk process button handler
  const bulkProcessBtnHandler = document.getElementById("bulkProcessBtn");
  if (bulkProcessBtnHandler) {
    bulkProcessBtnHandler.onclick = async () => {
      justiceDebugLog('bulkProcessBtn clicked');
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

  // Update last updated timestamp
  function updateLastUpdated() {
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) {
      const now = new Date();
      lastUpdatedEl.textContent = now.toLocaleString();
    }
  }

  // Update case count display
  function updateCaseCount() {
    const visibleRows = Array.from(trackerBody.querySelectorAll('tr:not([style*="display: none"])'));
    const caseCountEl = document.getElementById('caseCount');
    if (caseCountEl) {
      const count = visibleRows.length;
      caseCountEl.textContent = `${count} case${count === 1 ? '' : 's'}`;
    }
  }

  // Initialize dashboard
  updateDashboardStats();
  populateFilters();
  updateNoCasesDisplay();
  
  console.log('✅ Justice Dashboard initialized successfully');
}

/********** ANIMATED COUNTERS & DASHBOARD ENHANCEMENTS **********/
const DashboardEnhancements = {
  // Animate number counters
  animateCounter(element, target, duration = 2000) {
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current);
    }, 16);
  },

  // Initialize all counters with sample data
  initCounters() {
    const counters = [
      { id: 'totalCases', target: 247 },
      { id: 'activeCases', target: 23 },
      { id: 'analysisResults', target: 184 }
    ];

    counters.forEach(counter => {
      const element = document.getElementById(counter.id);
      if (element) {
        // Add stagger delay for visual appeal
        setTimeout(() => {
          this.animateCounter(element, counter.target);
        }, Math.random() * 500);
      }
    });
  },

  // Add professional button interactions (CSP compliant - no inline styles)
  initButtonAnimations() {
    const buttons = document.querySelectorAll('.justice-btn-primary, .justice-btn-secondary, .justice-btn-accent');
    buttons.forEach(button => {
      // Add classes for positioning
      button.classList.add('relative', 'overflow-hidden');
      
      button.addEventListener('click', function(e) {
        // Simple pulse animation using CSS classes only
        this.classList.add('animate-pulse');
        
        setTimeout(() => {
          this.classList.remove('animate-pulse');
        }, 600);
      });
    });
  },

  // Initialize all enhancements
  init() {
    // All styles are now in CSS files - no dynamic injection needed
    console.log('Dashboard enhancements initializing...');

    // Initialize features after DOM load
    setTimeout(() => {
      this.initCounters();
      this.initButtonAnimations();
    }, 500);
  }
};

/********** Initialize Application **********/
document.addEventListener('DOMContentLoaded', () => {
  console.log('Justice Dashboard starting...');
  
  // Check if app container exists
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('App container (#app) not found in DOM');
    return;
  }

  // Initialize dashboard enhancements first
  DashboardEnhancements.init();

  // Initialize authentication and render appropriate view
  if (DashboardAuth.init()) {
    // User is authenticated - show dashboard
    console.log('User authenticated, loading dashboard...');
    DashboardAuth.renderDashboard();
    
    // Initialize counters after dashboard is rendered
    setTimeout(() => {
      DashboardEnhancements.initCounters();
      console.log('Dashboard enhancements initialized');
    }, 1000);
  } else {
    // User not authenticated - show login form
    console.log('User not authenticated, showing login form...');
    DashboardAuth.renderLoginForm();
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
      const response = await fetch(`${DYNAMIC_API_BASE_URL}${url}`, defaultOptions);
      
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

// Wolfram Alpha Integration Functions
async function askWolfram(query) {
  const authToken = getAuthToken();
  if (!authToken) {
    throw new Error('Authentication required to use Wolfram Alpha');
  }

  const response = await fetch('/api/wolfram', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.success) {
    return data.result;
  } else {
    throw new Error(data.error || 'Wolfram Alpha API error');
  }
}

function showWolframResult(query, result) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden';
  
  modal.innerHTML = `
    <div class="flex items-center justify-between p-6 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">🧠 Wolfram Alpha Response</h3>
      <button id="closeWolframModal" class="text-gray-400 hover:text-gray-600 transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    
    <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
      <div class="mb-4">
        <h4 class="font-medium text-gray-700 mb-2">Query:</h4>
        <p class="bg-gray-50 p-3 rounded border text-sm">${query}</p>
      </div>
      
      <div>
        <h4 class="font-medium text-gray-700 mb-2">Response:</h4>
        <div class="bg-blue-50 p-4 rounded border">
          <pre class="whitespace-pre-wrap text-sm text-gray-800 font-mono">${JSON.stringify(result, null, 2)}</pre>
        </div>
      </div>
    </div>
    
    <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
      <button id="copyWolframResult" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
        📋 Copy Result
      </button>
      <button id="closeWolframModalBtn" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors">
        Close
      </button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Event handlers
  const closeModal = () => {
    document.body.removeChild(overlay);
  };
  
  document.getElementById('closeWolframModal').onclick = closeModal;
  document.getElementById('closeWolframModalBtn').onclick = closeModal;
  
  document.getElementById('copyWolframResult').onclick = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
      showNotification('Wolfram result copied to clipboard!', 'success');
    }).catch(() => {
      showNotification('Failed to copy to clipboard', 'error');
    });
  };
  
  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };
  
  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// Show full PDF content in modal
window.showFullContent = function(caseId) {
  const cases = JSON.parse(localStorage.getItem('legalCases') || '[]');
  const caseObj = cases.find(c => c.id === caseId);
  
  if (!caseObj || !caseObj.evidence) {
    showNotification('No content available for this case', 'error');
    return;
  }
  
  // Create modal for full content display
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
      <div class="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-xl font-bold text-gray-800">📄 ${caseObj.title} - Full Content</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div class="p-6 overflow-y-auto max-h-[70vh]">
        <pre class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">${caseObj.evidence}</pre>
      </div>
      <div class="p-4 border-t border-gray-200 bg-gray-50 text-center">
        <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Close
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

// Enhanced notification system for PDF operations
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500', 
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };
  
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Slide in
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}
