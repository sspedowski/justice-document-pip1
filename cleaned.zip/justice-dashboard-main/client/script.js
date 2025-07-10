class AuthManager {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async login(username, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = data.token;
        this.user = data.user;
        
        // Store in localStorage
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        
        return { success: true, user: this.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async logout() {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.token = null;
    this.user = null;
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}

// Initialize auth manager
const auth = new AuthManager();

// DOM elements
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const dashboardSection = document.getElementById('dashboard');
const loginSection = document.getElementById('loginSection');
const logoutBtn = document.getElementById('logoutBtn');
const userDisplay = document.getElementById('userDisplay');

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
  if (auth.isAuthenticated()) {
    showDashboard();
  } else {
    showLogin();
  }
});

// Login form handler
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
      showError('Please enter both username and password');
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    const result = await auth.login(username, password);
    
    if (result.success) {
      showDashboard();
    } else {
      showError(result.error || 'Login failed');
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  });
}

// Logout button handler
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await auth.logout();
    showLogin();
  });
}

// Show/hide sections
function showLogin() {
  if (loginSection) loginSection.style.display = 'block';
  if (dashboardSection) dashboardSection.style.display = 'none';
}

function showDashboard() {
  if (loginSection) loginSection.style.display = 'none';
  if (dashboardSection) dashboardSection.style.display = 'block';
  
  if (userDisplay && auth.user) {
    userDisplay.textContent = `Welcome, ${auth.user.username}`;
  }
}

function showError(message) {
  if (loginError) {
    loginError.textContent = message;
    loginError.style.display = 'block';
  }
}

// Protected API calls
async function makeAuthenticatedRequest(url, options = {}) {
  if (!auth.isAuthenticated()) {
    showLogin();
    return null;
  }

  const headers = {
    ...auth.getAuthHeaders(),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token expired, logout user
      await auth.logout();
      showLogin();
      return null;
    }

    return response;
  } catch (error) {
    console.error('API request error:', error);
    return null;
  }
}

// Update your existing PDF upload to use authentication
async function uploadPDF(file) {
  if (!auth.isAuthenticated()) {
    showError('Please log in first');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await makeAuthenticatedRequest('/api/summarize', {
    method: 'POST',
    body: formData
  });

  if (response && response.ok) {
    const data = await response.json();
    // Handle successful upload
    console.log('Upload successful:', data);
    return data;
  }
}