// Authentication and utility functions
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Check authentication status on page load
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showLogin();
        return false;
    }

    try {
        const response = await fetch('/api/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            showDashboard(userData);
            return true;
        } else {
            localStorage.removeItem('authToken');
            showLogin();
            return false;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLogin();
        return false;
    }
}

// Login functionality
async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }

    showLoading();

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (response.ok && data.token) {
            localStorage.setItem('authToken', data.token);
            showDashboard(data.user);
        } else {
            showError(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please try again.');
    } finally {
        hideLoading();
    }
}

// Logout functionality
function logout() {
    localStorage.removeItem('authToken');
    showLogin();
}

// Show login form
function showLogin() {
    const loginForm = document.getElementById('loginForm'); // Changed from 'login-form' to 'loginForm'
    const dashboard = document.getElementById('dashboard');
    if (loginForm) loginForm.style.display = 'block';
    if (dashboard) dashboard.style.display = 'none';
}
    // Focus username field if it exists
    const usernameField = document.getElementById('username');
    if (usernameField) usernameField.focus();
}

// Show dashboard
function showDashboard(userData) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Display user info
    if (userData && userData.username) {
        document.getElementById('userInfo').textContent = `Welcome, ${userData.username}`;
    }
    
    // Load dashboard data
    loadDashboardData();
}

// Load dashboard data
async function loadDashboardData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showLogin();
        return;
    }

    showLoading();

    try {
        const response = await fetch('/api/dashboard-data', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateDashboard(data);
        } else if (response.status === 401) {
            localStorage.removeItem('authToken');
            showLogin();
        } else {
            showError('Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Dashboard data error:', error);
        showError('Failed to load dashboard data');
    } finally {
        hideLoading();
    }
}

// Update dashboard with data
function updateDashboard(data) {
    // Update statistics
    if (data.stats) {
        document.getElementById('totalCases').textContent = data.stats.totalCases || 0;
        document.getElementById('pendingCases').textContent = data.stats.pendingCases || 0;
        document.getElementById('completedCases').textContent = data.stats.completedCases || 0;
    }

    // Update recent cases
    if (data.recentCases) {
        updateRecentCases(data.recentCases);
    }

    // Update charts if data available
    if (data.chartData) {
        updateCharts(data.chartData);
    }
}

// Update recent cases table
function updateRecentCases(cases) {
    const tbody = document.getElementById('recentCasesTable');
    if (!tbody) return;

    tbody.innerHTML = '';

    cases.forEach(case_ => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${escapeHtml(case_.caseNumber || 'N/A')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${escapeHtml(case_.title || 'N/A')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${escapeHtml(case_.status || 'N/A')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${case_.date ? new Date(case_.date).toLocaleDateString() : 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewCase('${case_.id}')" class="text-indigo-600 hover:text-indigo-900">
                    View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View individual case
async function viewCase(caseId) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showLogin();
        return;
    }

    try {
        const response = await fetch(`/api/cases/${caseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const caseData = await response.json();
            showCaseModal(caseData);
        } else {
            showError('Failed to load case details');
        }
    } catch (error) {
        console.error('Case view error:', error);
        showError('Failed to load case details');
    }
}

// Show case modal
function showCaseModal(caseData) {
    // Create modal content
    const modalContent = `
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="caseModal">
            <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium text-gray-900">Case Details</h3>
                        <button onclick="closeCaseModal()" class="text-gray-400 hover:text-gray-600">
                            <span class="sr-only">Close</span>
                            &#10005;
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Case Number</label>
                            <p class="text-sm text-gray-900">${escapeHtml(caseData.caseNumber || 'N/A')}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Title</label>
                            <p class="text-sm text-gray-900">${escapeHtml(caseData.title || 'N/A')}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Status</label>
                            <p class="text-sm text-gray-900">${escapeHtml(caseData.status || 'N/A')}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Description</label>
                            <p class="text-sm text-gray-900">${escapeHtml(caseData.description || 'No description available')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalContent);
}

// Close case modal
function closeCaseModal() {
    const modal = document.getElementById('caseModal');
    if (modal) {
        modal.remove();
    }
}

// Update charts (placeholder for future chart implementation)
function updateCharts(chartData) {
    // Placeholder for chart updates using Chart.js or similar
    console.log('Chart data received:', chartData);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// PDF handling functions
async function uploadPDF() {
    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Please select a PDF file');
        return;
    }

    if (file.type !== 'application/pdf') {
        showError('Please select a valid PDF file');
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        showLogin();
        return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    showLoading();

    try {
        const response = await fetch('/api/upload-pdf', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showError('PDF uploaded successfully');
            loadDashboardData(); // Refresh dashboard
            fileInput.value = ''; // Clear file input
        } else {
            showError(result.message || 'PDF upload failed');
        }
    } catch (error) {
        console.error('PDF upload error:', error);
        showError('PDF upload failed');
    } finally {
        hideLoading();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on page load
    checkAuth();

    // Login form event listeners
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', login);
    }

    // Handle Enter key in login form
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }

    // Logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // PDF upload button
    const uploadButton = document.getElementById('uploadButton');
    if (uploadButton) {
        uploadButton.addEventListener('click', uploadPDF);
    }

    // Refresh dashboard button
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadDashboardData);
    }
});

// Handle clicks outside modals to close them
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('bg-gray-600') && e.target.classList.contains('bg-opacity-50')) {
        closeCaseModal();
    }
});
