// Ensure Upload and Lawyer buttons always work, even if added dynamically
document.addEventListener("click", function (event) {
  // Check authorization before allowing upload or lawyer actions
  if (event.target && event.target.id === "uploadBtn") {
    if (window.DashboardAuth && window.DashboardAuth.isAuthenticated) {
      alert("Upload button (delegated)");
    } else {
      alert("Unauthorized: Please log in to upload documents.");
      if (window.showLoginForm) window.showLoginForm();
    }
  }
  if (event.target && event.target.id === "lawyerBtn") {
    if (window.DashboardAuth && window.DashboardAuth.isAuthenticated) {
      alert("Lawyer button (delegated)");
    } else {
      alert("Unauthorized: Please log in to access lawyer features.");
      if (window.showLoginForm) window.showLoginForm();
    }
  }
});
// Justice Dashboard - Authentication & Main App
// Secure authentication with proper session management

// PDF.js Status Check
document.addEventListener("DOMContentLoaded", () => {
  if (typeof pdfjsLib !== "undefined") {
    console.log("✅ PDF.js library loaded successfully");
    console.log("📚 PDF.js version:", pdfjsLib.version);
  } else {
    console.error(
      "❌ PDF.js library not found - PDF content extraction will not work",
    );
  }
});

// Environment detection helper
function getApiBaseUrl() {
  // If API_BASE_URL is defined globally (from index.html), use it
  if (typeof window.API_BASE_URL !== "undefined") {
    return window.API_BASE_URL;
  }

  // Fallback: Check if running locally
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "";

  // Return appropriate base URL
  return isLocal
    ? "http://localhost:3000"
    : window.location.origin;
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
    console.log("[JusticeDashboard]", ...args);
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
    const saved = localStorage.getItem("justiceAuth");
    if (saved) {
      try {
        const authData = JSON.parse(saved);
        const isValid =
          authData.timestamp &&
          Date.now() - authData.timestamp < 24 * 60 * 60 * 1000; // 24 hour expiry

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
        console.error("Auth check error:", error);
        this.clearAuth();
      }
    }
    return false;
  },

  // Authenticate user with server (CSRF protection)
  async authenticate(username, password) {
    try {
      // Retrieve CSRF token from meta tag or cookie
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || localStorage.getItem('justiceCsrfToken');
      if (typeof authFetch === 'undefined') {
        const mod = await import('../justice-dashboard/src/lib/auth-fetch.js');
        window.authFetch = mod.authFetch;
      }
      const response = await authFetch(`${DYNAMIC_API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-Token": csrfToken }),
        },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();

      if (data.success && data.user && data.token) {
        this.currentUser = data.user;
        this.authToken = data.token;
        this.isAuthenticated = true;

        // Store auth info securely with timestamp
        localStorage.setItem(
          "justiceAuth",
          JSON.stringify({
            user: this.currentUser,
            token: this.authToken,
            timestamp: Date.now(),
          }),
        );

        // Store CSRF token if provided
        if (data.csrfToken) {
          localStorage.setItem('justiceCsrfToken', data.csrfToken);
        }

        return { success: true, user: this.currentUser };
      }

      return { success: false, error: data.error || "Login failed" };
    } catch (error) {
      console.error("Authentication error:", error);
      return { success: false, error: error.message };
    }
  },

  // Show login form
  showLoginForm() {
    const app = document.getElementById("app");
    if (app) {
      // You can customize this login form HTML as needed
      app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="max-w-md w-full space-y-8">
            <div>
              <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Sign in to Justice Dashboard
              </h2>
            </div>
            <form class="mt-8 space-y-6" id="loginForm">
              <div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Username"
                />
              </div>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Password"
                />
              </div>
              <div>
                <button
                  type="submit"
                  class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      `;

      // Bind login form
      const loginForm = document.getElementById("loginForm");
      if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;
          this.authenticate(username, password);
        });
      }
    }
  },

  // Logout user
  async logout() {
    try {
      // Call server logout endpoint if token exists
      if (this.authToken) {
        await fetch(`${DYNAMIC_API_BASE_URL}/api/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    this.clearAuth();
    this.renderLoginForm();
  },

  // Clear authentication state
  clearAuth() {
    this.currentUser = null;
    this.authToken = null;
    this.isAuthenticated = false;
    localStorage.removeItem("justiceAuth");
  },

  // Render login form
  renderLoginForm() {
    const app = document.getElementById("app");
    if (!app) {
      console.error("App container not found");
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
  // Helper function to make authenticated requests (CSRF protection)
  async makeAuthenticatedRequest(url, options = {}) {
    if (!DashboardAuth.isAuthenticated) {
      console.error("User not authenticated");
      DashboardAuth.showLoginForm();
      return null;
    }
    const csrfToken = localStorage.getItem('justiceCsrfToken');
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${DashboardAuth.authToken}`,
      "Content-Type": "application/json",
      ...(csrfToken && { "X-CSRF-Token": csrfToken }),
    };
    try {
      const response = await fetch(`${DYNAMIC_API_BASE_URL}${url}`, {
        ...options,
        headers,
        credentials: "same-origin"
      });
      if (response.status === 401) {
        // Token expired or invalid
        DashboardAuth.clearAuth();
        DashboardAuth.showLoginForm();
        return null;
      }
      return response;
    } catch (error) {
      console.error("API request error:", error);
      return null;
    }
  },
        // Token expired or invalid
        DashboardAuth.clearAuth();
        DashboardAuth.showLoginForm();
        return null;
      }
      return response;
    } catch (error) {
      console.error("API request error:", error);
      return null;
    }
  },

  // Initialize login form event listeners
  initializeLoginForm() {
    // Add event listeners
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }

    // Add Enter key support for password field
    const passwordField = document.getElementById("loginPassword");
    if (passwordField) {
      passwordField.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.handleLogin(e);
        }
      });
    }
  },

  // Handle login form submission
  async handleLogin(event) {
    event.preventDefault();

    const usernameEl = document.getElementById("loginUsername");
    const passwordEl = document.getElementById("loginPassword");
    const errorEl = document.getElementById("loginError");
    const btnEl = document.getElementById("loginBtn");
    const btnTextEl = document.getElementById("loginBtnText");
    const btnSpinnerEl = document.getElementById("loginBtnSpinner");

    if (!usernameEl || !passwordEl) {
      this.showLoginError("Login form not properly initialized");
      return;
    }

    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    // Basic validation
    if (!username || !password) {
      this.showLoginError("Please enter both username and password");
      return;
    }

    // Show loading state
    btnEl.disabled = true;
    btnTextEl.classList.add("hidden");
    btnSpinnerEl.classList.remove("hidden");
    errorEl.classList.add("hidden");

    try {
      const result = await this.authenticate(username, password);

      if (result.success) {
        // Success - redirect to dashboard
        this.renderDashboard();
      } else {
        this.showLoginError(
          result.error || "Invalid credentials. Please try again.",
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showLoginError(
        "Connection error. Please check your network and try again.",
      );
    } finally {
      // Reset button state
      btnEl.disabled = false;
      btnTextEl.classList.remove("hidden");
      btnSpinnerEl.classList.add("hidden");
    }
  },

  // Show login error message
  showLoginError(message) {
    const errorEl = document.getElementById("loginError");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        errorEl.classList.add("hidden");
      }, 5000);
    }
  },

  // Render main dashboard
  renderDashboard() {
    const app = document.getElementById("app");
    if (!app) {
      console.error("App container not found");
      return;
    }

    // Show the dashboard content that's already in the HTML
    const loadingScreen = document.getElementById("loadingScreen");
    const dashboardContent = document.getElementById("dashboardContent");

    if (loadingScreen) {
      loadingScreen.classList.add("hidden");
    }

    if (dashboardContent) {
      dashboardContent.classList.remove("hidden");

      // Initialize dashboard functionality only after content is visible
      setTimeout(() => {
        initializeJusticeDashboard();
      }, 50);
    } else {
      console.error("Dashboard content container not found");
    }
  },

  showLoginForm() {
    console.log("showLoginForm() called");
    // Use the existing app div instead of replacing the entire body
    const appDiv = document.getElementById("app");
    console.log("App div found in showLoginForm?", !!appDiv);

    if (!appDiv) {
      console.error("App div not found for login form");
      console.log(
        "Available elements with IDs:",
        Array.from(document.querySelectorAll("[id]")).map((el) => el.id),
      );
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
      const loginForm = document.getElementById("loginForm");
      const loginBtn = document.getElementById("loginBtn");
      const errorDiv = document.getElementById("loginError");

      if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
          e.preventDefault();

          const username = document.getElementById("username").value.trim();
          const password = document.getElementById("password").value;

          if (!username || !password) {
            errorDiv.textContent = "Please enter both username and password";
            errorDiv.classList.remove("hidden");
            return;
          }

          // Clear previous errors
          errorDiv.classList.add("hidden");

          // Update button state
          loginBtn.textContent = "Authenticating...";
          loginBtn.disabled = true;

          try {
            const result = await this.authenticate(username, password);

            if (result.success) {
              this.loadDashboard();
            } else {
              errorDiv.textContent =
                result.error || "Invalid username or password";
              errorDiv.classList.remove("hidden");
            }
          } catch (error) {
            console.error("Login error:", error);
            errorDiv.textContent = "Connection error. Please try again.";
            errorDiv.classList.remove("hidden");
          } finally {
            // Reset button state
            loginBtn.textContent = "Access Dashboard";
            loginBtn.disabled = false;
          }
        });
      }
    }, 100);
  },

  loadDashboard() {
    // Instead of replacing the entire body, just replace the app div content
    const appDiv = document.getElementById("app");
    if (!appDiv) {
      console.error("App div not found");
      return;
    }

    // CSP-compliant dashboard content (no inline scripts or external CDNs)
    appDiv.innerHTML = `
      <!-- Header with user info and logout -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 class="text-xl font-bold text-gray-900">Justice Dashboard</h1>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">Welcome, ${this.escapeHtml(this.currentUser.fullName || this.currentUser.username)}</span>
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
      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          this.logout();
        });
      }

      // Re-run the main dashboard code
      initializeJusticeDashboard();
    }, 100);
  },

  // Animate number counters
  animateCounter(element, target, duration = 2000) {
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (
        (increment > 0 && current >= target) ||
        (increment < 0 && current <= target)
      ) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current);
    }, 16);
  },

  // Initialize all counters with sample data
  initCounters() {
    const counters = [
      { id: "totalCases", target: 247 },
      { id: "activeCases", target: 23 },
      { id: "analysisResults", target: 184 },
    ];

    counters.forEach((counter) => {
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
    const buttons = document.querySelectorAll(
      ".justice-btn-primary, .justice-btn-secondary, .justice-btn-accent",
    );
    buttons.forEach((button) => {
      // Add classes for positioning
      button.classList.add("relative", "overflow-hidden");

      button.addEventListener("click", function (e) {
        // Simple pulse animation using CSS classes only
        this.classList.add("animate-pulse");

        setTimeout(() => {
          this.classList.remove("animate-pulse");
        }, 600);
      });
    });
  },

  // Initialize all enhancements
  init() {
    // All styles are now in CSS files - no dynamic injection needed
    console.log("Dashboard enhancements initializing...");

    // Initialize features after DOM load
    setTimeout(() => {
      this.initCounters();
      this.initButtonAnimations();
    }, 500);
  },

  // XSS prevention helper
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

// Make DashboardAuth globally available immediately
window.DashboardAuth = DashboardAuth;
window.showLoginForm = DashboardAuth.showLoginForm.bind(DashboardAuth);
console.log("✅ DashboardAuth attached to window object");
console.log("✅ checkAuth method exists:", typeof DashboardAuth.checkAuth === 'function');
console.log("✅ showLoginForm method exists:", typeof window.showLoginForm === 'function');

/********** Dashboard Statistics Functions **********/
function updateDashboardStats() {
  // Get all tracker rows to calculate statistics
  const trackerBody = document.getElementById("trackerTableBody");
  const rows = trackerBody ? trackerBody.querySelectorAll("tr") : [];

  // Calculate total cases
  const totalCases = rows.length;

  // Calculate active cases and PDF statistics
  let activeCases = 0;
  let documentsProcessed = 0;
  let pdfDocuments = 0;
  let totalPdfCharacters = 0;

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 4) {
      // Check status column (assuming it's in the 4th column)
      const status = cells[3].textContent.trim().toLowerCase();
      if (
        status !== "closed" &&
        status !== "complete" &&
        status !== "resolved"
      ) {
        activeCases++;
      }

      // Count documents and analyze PDF content
      const fileLinks = row.querySelectorAll('a[href*="blob:"]');
      documentsProcessed += fileLinks.length;

      // Check for PDF documents and count characters
      fileLinks.forEach((link) => {
        if (link.textContent.toLowerCase().includes(".pdf")) {
          pdfDocuments++;
          // Try to estimate content from visible text in the row
          const rowText = row.textContent;
          if (rowText.length > 200) {
            // Likely contains extracted PDF content
            totalPdfCharacters += rowText.length;
          }
        }
      });
    }
  });

  // Update dashboard stat elements
  const totalCasesEl = document.getElementById("totalCases");
  const activeCasesEl = document.getElementById("activeCases");
  const documentsProcessedEl = document.getElementById("documentsProcessed");
  const systemStatusEl = document.getElementById("systemStatus");

  if (totalCasesEl) totalCasesEl.textContent = totalCases;
  if (activeCasesEl) activeCasesEl.textContent = activeCases;
  if (documentsProcessedEl)
    documentsProcessedEl.textContent = documentsProcessed;
  if (systemStatusEl)
    systemStatusEl.textContent = totalCases > 0 ? "Active" : "Ready";

  // Update PDF-specific stats if elements exist
  const pdfDocumentsEl = document.getElementById("pdfDocuments");
  const pdfCharactersEl = document.getElementById("pdfCharacters");

  if (pdfDocumentsEl) pdfDocumentsEl.textContent = pdfDocuments;
  if (pdfCharactersEl)
    pdfCharactersEl.textContent = `${(totalPdfCharacters / 1000).toFixed(1)}K`;

  console.log(
    `📊 Dashboard stats updated: ${totalCases} total, ${activeCases} active, ${documentsProcessed} documents, ${pdfDocuments} PDFs (${totalPdfCharacters} chars)`,
  );
}

function updateNoCasesDisplay() {
  // Reset all stats to 0 when no cases exist
  const totalCasesEl = document.getElementById("totalCases");
  const activeCasesEl = document.getElementById("activeCases");
  const documentsProcessedEl = document.getElementById("documentsProcessed");
  const systemStatusEl = document.getElementById("systemStatus");

  if (totalCasesEl) totalCasesEl.textContent = "0";
  if (activeCasesEl) activeCasesEl.textContent = "0";
  if (documentsProcessedEl) documentsProcessedEl.textContent = "0";
  if (systemStatusEl) systemStatusEl.textContent = "Ready";
}

/********** Filter Functions **********/
function populateFilters() {
  // Get all tracker rows to read existing data
  const trackerBody = document.querySelector("#results");
  const rows = trackerBody ? trackerBody.querySelectorAll("tr") : [];

  // Get filter elements
  const categoryFilter = document.getElementById("categoryFilter");
  const misconductFilter = document.getElementById("misconductFilter");
  const clearFiltersBtn = document.getElementById("clearFilters");

  // Collect unique values from existing data
  const categories = new Set();
  const misconductTypes = new Set();

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 3) {
      // Category is in first column
      const category = cells[0].textContent.trim();
      if (category) categories.add(category);

      // Misconduct type is in third column (misconduct select)
      const misconductSelect = cells[2].querySelector("select");
      if (misconductSelect && misconductSelect.value) {
        misconductTypes.add(misconductSelect.value);
      }
    }
  });

  // Populate category filter (keep existing static options + dynamic ones)
  if (categoryFilter) {
    const staticOptions = categoryFilter.innerHTML;
    const dynamicOptions = Array.from(categories)
      .filter((cat) => !staticOptions.includes(cat)) // Don't duplicate existing options
      .map((cat) => `<option value="${cat}">${cat}</option>`)
      .join("");

    if (dynamicOptions) {
      categoryFilter.innerHTML = staticOptions + dynamicOptions;
    }
  }

  // Populate misconduct filter (keep existing static options + dynamic ones)
  if (misconductFilter) {
    const staticOptions = misconductFilter.innerHTML;
    const dynamicOptions = Array.from(misconductTypes)
      .filter((type) => !staticOptions.includes(type)) // Don't duplicate existing options
      .map((type) => `<option value="${type}">${type}</option>`)
      .join("");

    if (dynamicOptions) {
      misconductFilter.innerHTML = staticOptions + dynamicOptions;
    }
  }

  // Set up filter event handlers
  if (categoryFilter) {
    categoryFilter.addEventListener("change", applyFilters);
  }

  if (misconductFilter) {
    misconductFilter.addEventListener("change", applyFilters);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearAllFilters);
  }
}

function applyFilters() {
  const trackerBody = document.querySelector("#results");
  const rows = trackerBody ? trackerBody.querySelectorAll("tr") : [];

  const categoryFilter = document.getElementById("categoryFilter");
  const misconductFilter = document.getElementById("misconductFilter");

  const selectedCategory = categoryFilter ? categoryFilter.value : "";
  const selectedMisconduct = misconductFilter ? misconductFilter.value : "";

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 3) {
      const category = cells[0].textContent.trim();
      const misconductSelect = cells[2].querySelector("select");
      const misconduct = misconductSelect ? misconductSelect.value : "";

      const categoryMatch = !selectedCategory || category === selectedCategory;
      const misconductMatch =
        !selectedMisconduct || misconduct === selectedMisconduct;

      // Show/hide row based on filter matches
      row.style.display = categoryMatch && misconductMatch ? "" : "none";
    }
  });

  // Update stats after filtering
  updateDashboardStats();
}

function clearAllFilters() {
  const categoryFilter = document.getElementById("categoryFilter");
  const misconductFilter = document.getElementById("misconductFilter");

  if (categoryFilter) categoryFilter.value = "";
  if (misconductFilter) misconductFilter.value = "";

  // Show all rows
  const trackerBody = document.querySelector("#results");
  const rows = trackerBody ? trackerBody.querySelectorAll("tr") : [];
  rows.forEach((row) => {
    row.style.display = "";
  });

  // Update stats
  updateDashboardStats();
}

// Helper to clear stored table data
function clearOldData() {
  const trackerBody = document.querySelector("#results");
  localStorage.removeItem("justiceTrackerRows");
  if (trackerBody) {
    trackerBody.innerHTML = "";
  }
  console.log("Justice tracker data cleared");
}

/********** Add Case to Tracker Function **********/
function addCaseToTracker(caseData) {
  const trackerBody = document.getElementById("trackerTableBody");
  if (!trackerBody) {
    console.error("Tracker table body not found");
    return;
  }

  const row = document.createElement("tr");
  row.className = "border-b border-gray-200 hover:bg-gray-50";
  
  const viewPDFLink = caseData.fileURL 
    ? `<a href="${caseData.fileURL}" target="_blank" class="text-blue-600 underline text-sm hover:text-blue-800 mr-3">View PDF</a>`
    : '<span class="text-gray-400 text-sm">No PDF</span>';

  row.innerHTML = `
    <td class="p-3">${caseData.caseId}</td>
    <td class="p-3">${caseData.title}</td>
    <td class="p-3">
      <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">${caseData.status}</span>
    </td>
    <td class="p-3">${caseData.date}</td>
    <td class="p-3">${caseData.fileName}</td>
    <td class="p-3">
      ${viewPDFLink}
      <button onclick="this.closest('tr').remove(); saveTable();" class="text-red-600 text-sm hover:text-red-800">🗑️ Delete</button>
    </td>
  `;
  
  trackerBody.appendChild(row);
  
  // Save to localStorage
  saveTable();
  
  // Update dashboard stats
  updateDashboardStats();
  
  console.log("✅ Case added to tracker:", caseData.caseId);
}

/********** Save Table Function **********/
function saveTable() {
  const trackerBody = document.getElementById("trackerTableBody");
  if (trackerBody) {
    localStorage.setItem("justiceTrackerRows", trackerBody.innerHTML);
  }
}

/********** Upload and Analyze File Function **********/
async function uploadAndAnalyzeFile(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${DYNAMIC_API_BASE_URL}/api/summarize`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Upload failed");
    const result = await response.json();
    console.log("✅ File uploaded & summarized:", result);
    
    // Add the result to the case tracker table
    addCaseToTracker({
      caseId: `CASE-${Date.now()}`,
      title: result.fileName || file.name,
      status: "active",
      date: new Date().toLocaleDateString(),
      fileName: result.fileName || file.name,
      fileURL: result.fileURL,
      summary: result.summary || "PDF processed successfully"
    });
    
    return result;
  } catch (err) {
    console.error("❌ Error uploading file:", err);
    alert("Upload failed: " + err.message);
    throw err;
  }
}

/********** Main Dashboard Initialization **********/
let dashboardInitialized = false;

function initializeJusticeDashboard() {
  if (dashboardInitialized) {
    console.warn("🛑 Dashboard already initialized. Skipping...");
    return;
  }
  dashboardInitialized = true;

  const trackerTableBody = document.getElementById("trackerTableBody");
  if (!trackerTableBody) {
    console.warn("Could not find tracker table body – retrying...");
    dashboardInitialized = false; // Reset flag if DOM not ready
    setTimeout(initializeJusticeDashboard, 150); // Retry after 150ms
    return;
  }

  console.log("✅ Tracker table found. Initializing upload system...");

  // Timeout variable for optimized saving
  // let saveTimeout; // FIXED: Using declaration from function start

  // DOM Elements
  const fileInput = document.getElementById("fileInput");
  const docInput = document.getElementById("docInput");
  const processBtn = document.getElementById("processBtn");
  const summarizeBtn = document.getElementById("generateBtn");
  const exportBtn = document.getElementById("exportBtn");
  const askBtn = document.getElementById("askWolfram");
  const summaryBox = document.getElementById("summaryBox");
  let trackerBody = document.querySelector("#results");

  // Fallback for trackerBody - use the confirmed table we found
  if (!trackerBody) {
    trackerBody = trackerTableBody;
  }
  if (!trackerBody) {
    trackerBody = document.querySelector("#trackerTable tbody");
  }
  if (!trackerBody) {
    console.error("Could not find tracker table body");
    return;
  }

  // Add event handler for the Process Document button (only once)
  if (processBtn && fileInput && !processBtn.hasAttribute('data-handler-attached')) {
    processBtn.addEventListener("click", async () => {
      const files = fileInput.files;
      if (files.length === 0) {
        alert("Please select a file first!");
        return;
      }

      console.log(`📁 Processing ${files.length} file(s)...`);
      
      // Disable button during processing
      processBtn.disabled = true;
      processBtn.textContent = "Processing...";
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📄 Processing file: ${file.name}`);
        
        try {
          await uploadAndAnalyzeFile(file);
          console.log(`✅ Successfully processed: ${file.name}`);
        } catch (error) {
          console.error(`❌ Failed to process ${file.name}:`, error);
          alert(`Failed to process ${file.name}: ${error.message}`);
        }
      }
      
      // Re-enable button and clear input
      processBtn.disabled = false;
      processBtn.textContent = "📄 Process Document";
      fileInput.value = '';
      console.log("🔄 File input cleared");
    });
    
    processBtn.setAttribute('data-handler-attached', 'true');
    console.log("✅ Process Document button event handler attached");
  } else if (processBtn && processBtn.hasAttribute('data-handler-attached')) {
    console.log("ℹ️ Process Document button handler already attached");
  } else {
    console.warn("❌ Process Document button or file input not found");
  }

  // Dashboard elements
  const textInput = document.getElementById("textInput");
  const askWolframBtn = document.getElementById("askWolfram");

  // Wire up Ask Wolfram Alpha button
  if (askWolframBtn) {
    clearOldData();
    const saved = localStorage.getItem("justiceTrackerRows");
    if (saved) {
      trackerBody.innerHTML = saved;

      // ✅ MIGRATION: Update existing rows to use "View PDF" hyperlinks
      migrateExistingRowsToHyperlinks();

      updateDashboardStats();
      populateFilters();
    } else {
      // Show no cases message initially
      updateNoCasesDisplay();
    }

    // Migration function to update existing rows with new "View PDF" hyperlink format
    function migrateExistingRowsToHyperlinks() {
      const rows = trackerBody.querySelectorAll("tr");
      let updated = false;

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 7) {
          // Ensure we have enough columns
          const actionCell = cells[6]; // Actions column (7th column, index 6)

          // Check if this row has old button format
          const oldViewButton = actionCell.querySelector(
            'button[onclick*="window.open"]',
          );
          const oldViewButtonText = actionCell.querySelector("button");

          if (oldViewButton) {
            // Extract the fileURL from the onclick attribute
            const onclickAttr = oldViewButton.getAttribute("onclick");
            const fileURLMatch = onclickAttr.match(
              /window\.open\(['"]([^'"]+)['"]/,
            );

            if (fileURLMatch) {
              const fileURL = fileURLMatch[1];

              // Replace button with hyperlink
              const viewLink = document.createElement("a");
              viewLink.innerText = "View PDF";
              viewLink.href = fileURL;
              viewLink.target = "_blank";
              viewLink.className =
                "text-blue-600 underline text-sm hover:text-blue-800 mr-3";

              // Keep delete button if it exists
              const deleteButton = actionCell.querySelector(
                'button[onclick*="remove"]',
              );

              // Clear the cell and add the new hyperlink
              actionCell.innerHTML = "";
              actionCell.appendChild(viewLink);

              if (deleteButton) {
                actionCell.appendChild(deleteButton);
              }

              updated = true;
            }
          }
          // Check for old "View" button with emoji
          else if (
            oldViewButtonText &&
            oldViewButtonText.textContent.includes("👁️")
          ) {
            const onclickAttr = oldViewButtonText.getAttribute("onclick");
            if (onclickAttr) {
              const fileURLMatch = onclickAttr.match(
                /window\.open\(['"]([^'"]+)['"]/,
              );

              if (fileURLMatch) {
                const fileURL = fileURLMatch[1];

                // Replace with hyperlink
                const viewLink = document.createElement("a");
                viewLink.innerText = "View PDF";
                viewLink.href = fileURL;
                viewLink.target = "_blank";
                viewLink.className =
                  "text-blue-600 underline text-sm hover:text-blue-800 mr-3";

                // Keep delete button
                const deleteButton = actionCell.querySelector(
                  'button[onclick*="remove"]',
                );

                actionCell.innerHTML = "";
                actionCell.appendChild(viewLink);

                if (deleteButton) {
                  actionCell.appendChild(deleteButton);
                }

                updated = true;
              }
            }
          }
          // Check for "N/A" or "No file" text and update to "No PDF"
          else if (
            actionCell.textContent.trim() === "N/A" ||
            actionCell.textContent.includes("No file")
          ) {
            actionCell.innerHTML =
              '<span class="text-gray-400 text-sm">No PDF</span>';
            updated = true;
          }
        }
      });

      // Save the updated table if changes were made
      if (updated) {
        console.log('✅ Migrated existing rows to use "View PDF" hyperlinks');
        saveTable();
      }
    }

    // PDF to text converter

    /********** Initialize Application **********/
    document.addEventListener("DOMContentLoaded", () => {
      console.log("Justice Dashboard starting...");

      // Check if app container exists
      const appContainer = document.getElementById("app");
      if (!appContainer) {
        console.error("App container (#app) not found in DOM");
        return;
      }

      // Initialize dashboard enhancements first
      DashboardEnhancements.init();

      // Initialize authentication and render appropriate view
      if (DashboardAuth.init()) {
        // User is authenticated - show dashboard
        console.log("User authenticated, loading dashboard...");
        DashboardAuth.renderDashboard();

        // Initialize counters after dashboard is rendered
        setTimeout(() => {
          DashboardEnhancements.initCounters();
          console.log("Dashboard enhancements initialized");
        }, 1000);
      } else {
        // User not authenticated - show login form
        console.log("User not authenticated, showing login form...");
        DashboardAuth.renderLoginForm();
      }
    });

    // Initialize authentication on load
    try {
      DashboardAuth.init();
      console.log("✅ DashboardAuth initialized successfully");
    } catch (error) {
      console.error("❌ DashboardAuth initialization error:", error);
    }

    // Global function to manually clear data (can be called from console)
    window.clearJusticeData = function () {
      localStorage.removeItem("justiceTrackerRows");
      location.reload();
    };

    // Expose clearOldData globally for debugging
    window.clearOldData = clearOldData;

    // Global debugging functions
    window.debugDashboard = function () {
      console.log("=== Dashboard Debug Info ===");
      console.log("Authentication:", {
        isAuthenticated: DashboardAuth.isAuthenticated,
        user: DashboardAuth.currentUser,
        token: DashboardAuth.authToken ? "Present" : "Missing",
      });
      console.log("DOM elements:", {
        fileInput: document.getElementById("fileInput"),
        generateBtn: document.getElementById("generateBtn"),
        results: document.querySelector("#results"),
        trackerTable: document.getElementById("trackerTable"),
      });
      console.log(
        "All elements with IDs:",
        Array.from(document.querySelectorAll("[id]")).map((el) => el.id),
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
    if (typeof module !== "undefined" && module.exports) {
      module.exports = {
        DashboardAuth,
        isUserAuthenticated,
        getCurrentUser,
        getAuthToken,
        logoutUser,
      };
    }

    // API Helper Functions for Authenticated Requests
    const ApiHelper = {
      // Make authenticated API requests
      async makeRequest(url, options = {}) {
        const authToken = getAuthToken();
        const defaultOptions = {
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          ...options,
        };

        // Merge headers if provided
        if (options.headers) {
          defaultOptions.headers = {
            ...defaultOptions.headers,
            ...options.headers,
          };
        }

        try {
          const response = await fetch(
            `${DYNAMIC_API_BASE_URL}${url}`,
            defaultOptions,
          );

          // Handle unauthorized responses
          if (response.status === 401) {
            DashboardAuth.logout();
            throw new Error("Session expired. Please log in again.");
          }

          return response;
        } catch (error) {
          console.error("API request failed:", error);
          throw error;
        }
      },

      // Upload file with authentication
      async uploadFile(file, additionalData = {}) {
        const formData = new FormData();
        formData.append("file", file);

        // Add any additional data
        Object.keys(additionalData).forEach((key) => {
          formData.append(key, additionalData[key]);
        });

        const authToken = getAuthToken();
        return this.makeRequest("/api/summarize", {
          method: "POST",
          body: formData,
          headers: {
            // Don't set Content-Type for FormData, let browser set it
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
        });
      },

      // Get user profile
      async getProfile() {
        const response = await this.makeRequest("/api/profile");
        return response.json();
      },

      // Admin: Get all users
      async getUsers() {
        const response = await this.makeRequest("/api/admin/users");
        return response.json();
      },

      // Admin: Add user
      async addUser(userData) {
        const response = await this.makeRequest("/api/admin/users", {
          method: "POST",
          body: JSON.stringify(userData),
        });
        return response.json();
      },

      // Admin: Delete user
      async deleteUser(userId) {
        const response = await this.makeRequest(`/api/admin/users/${userId}`, {
          method: "DELETE",
        });
        return response.json();
      },
    };

    // Wolfram Alpha Integration Functions
    async function askWolfram(query) {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error("Authentication required to use Wolfram Alpha");
      }

      const response = await fetch("/api/wolfram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      if (data.success) {
        return data.result;
      } else {
        throw new Error(data.error || "Wolfram Alpha API error");
      }
    }

    function showWolframResult(query, result) {
      // Create modal overlay
      const overlay = document.createElement("div");
      overlay.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";

      // Create modal content
      const modal = document.createElement("div");
      modal.className =
        "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden";

      // Create modal content safely without innerHTML
      const header = document.createElement('div');
      header.className = 'flex items-center justify-between p-6 border-b border-gray-200';
      
      const title = document.createElement('h3');
      title.className = 'text-lg font-semibold text-gray-900';
      title.textContent = '🧠 Wolfram Alpha Response';
      
      const closeBtn = document.createElement('button');
      closeBtn.id = 'closeWolframModal';
      closeBtn.className = 'text-gray-400 hover:text-gray-600 transition-colors';
      closeBtn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
      
      header.appendChild(title);
      header.appendChild(closeBtn);
      
      const content = document.createElement('div');
      content.className = 'p-6 overflow-y-auto max-h-[calc(90vh-120px)]';
      
      const querySection = document.createElement('div');
      querySection.className = 'mb-4';
      const queryLabel = document.createElement('h4');
      queryLabel.className = 'font-medium text-gray-700 mb-2';
      queryLabel.textContent = 'Query:';
      const queryText = document.createElement('p');
      queryText.className = 'bg-gray-50 p-3 rounded border text-sm';
      queryText.textContent = query; // Safe text content
      querySection.appendChild(queryLabel);
      querySection.appendChild(queryText);
      
      const responseSection = document.createElement('div');
      const responseLabel = document.createElement('h4');
      responseLabel.className = 'font-medium text-gray-700 mb-2';
      responseLabel.textContent = 'Response:';
      const responseDiv = document.createElement('div');
      responseDiv.className = 'bg-blue-50 p-4 rounded border';
      const responsePre = document.createElement('pre');
      responsePre.className = 'whitespace-pre-wrap text-sm text-gray-800 font-mono';
      responsePre.textContent = JSON.stringify(result, null, 2); // Safe text content
      responseDiv.appendChild(responsePre);
      responseSection.appendChild(responseLabel);
      responseSection.appendChild(responseDiv);
      
      content.appendChild(querySection);
      content.appendChild(responseSection);
      
      const footer = document.createElement('div');
      footer.className = 'flex justify-end gap-3 p-6 border-t border-gray-200';
      
      const copyBtn = document.createElement('button');
      copyBtn.id = 'copyWolframResult';
      copyBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors';
      copyBtn.textContent = '📋 Copy Result';
      
      const closeModalBtn = document.createElement('button');
      closeModalBtn.id = 'closeWolframModalBtn';
      closeModalBtn.className = 'px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors';
      closeModalBtn.textContent = 'Close';
      
      footer.appendChild(copyBtn);
      footer.appendChild(closeModalBtn);
      
      modal.appendChild(header);
      modal.appendChild(content);
      modal.appendChild(footer);

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Event handlers
      const closeModal = () => {
        document.body.removeChild(overlay);
      };

      document.getElementById("closeWolframModal").onclick = closeModal;
      document.getElementById("closeWolframModalBtn").onclick = closeModal;

      document.getElementById("copyWolframResult").onclick = () => {
        navigator.clipboard
          .writeText(JSON.stringify(result, null, 2))
          .then(() => {
            showNotification("Wolfram result copied to clipboard!", "success");
          })
          .catch(() => {
            showNotification("Failed to copy to clipboard", "error");
          });
      };

      // Close on overlay click
      overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
      };

      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          closeModal();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);
    }

    // ====================================================================
    // ChatGPT's Exact "View PDF" Implementation - Added as requested
    // ====================================================================

    // Justice Dashboard Script - ChatGPT Version

    // Add a new row to the tracker (secure version)
    function addToTracker(summary) {
      const tableBody = document.querySelector("#trackerTable tbody");
      if (!tableBody) return;
      
      const newRow = tableBody.insertRow();

      // Safely add cells with sanitized content
      newRow.insertCell().textContent = summary.category || '';
      newRow.insertCell().textContent = summary.child || '';
      newRow.insertCell().textContent = summary.misconduct || '';
      newRow.insertCell().textContent = summary.summary || '';

      const viewCell = newRow.insertCell();
      if (summary.fileURL) {
        const viewLink = document.createElement("a");
        viewLink.textContent = "View PDF";
        viewLink.href = summary.fileURL;
        viewLink.target = "_blank";
        viewLink.className = "text-blue-600 underline";
        viewCell.appendChild(viewLink);
      } else {
        viewCell.textContent = "No PDF";
      }
    }

    // Example initialization with mock data
    document.addEventListener("DOMContentLoaded", () => {
      const exampleSummaries = [
        {
          category: "Medical",
          child: "Jace",
          misconduct: "Withholding treatment",
          summary: "Medical report shows delayed care.",
          fileURL: "pdfs/example1.pdf",
        },
        {
          category: "Legal",
          child: "Josh",
          misconduct: "Due process violation",
          summary: "Court order issued without proper hearing.",
          fileURL: "pdfs/example2.pdf",
        },
      ];

      exampleSummaries.forEach(addToTracker);
    });

    // ====================================================================
    // End ChatGPT's Implementation
    // ====================================================================

    // Manual migration function for users to update existing documents
    function updateExistingDocuments() {
      console.log(
        '🔄 Updating existing documents to use "View PDF" hyperlinks...',
      );
      migrateExistingRowsToHyperlinks();

      // Also trigger a re-render to ensure all updates are visible
      updateDashboardStats();
      populateFilters();

      // Show success notification
      showNotification(
        "✅ Successfully updated existing documents with \"View PDF\" hyperlinks!",
        "success",
      );
    }

    // Expose function globally for console access
    window.updateExistingDocuments = updateExistingDocuments;
  }
} // End of initializeJusticeDashboard function

// Initialize the dashboard when DOM is loaded (only once)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeJusticeDashboard);
} else {
  initializeJusticeDashboard();
}
