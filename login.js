// Justice Dashboard Login JavaScript
// CSP-compliant external JavaScript

// Check if already logged in
if (window.authManager && window.authManager.isAuthenticated()) {
    window.location.href = '/secure-dashboard.html';
}

// DOM elements
let loginForm, usernameInput, passwordInput, loginButton, loginIcon, loadingIcon, loginText;
let alertContainer, alertMessage, alertIcon, togglePassword, eyeIcon;
let serverIndicator, serverStatus, connectionStatus;

// Initialize DOM elements when page loads
function initializeDOMElements() {
    loginForm = document.getElementById('loginForm');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
    loginButton = document.getElementById('loginButton');
    loginIcon = document.getElementById('loginIcon');
    loadingIcon = document.getElementById('loadingIcon');
    loginText = document.getElementById('loginText');
    alertContainer = document.getElementById('alertContainer');
    alertMessage = document.getElementById('alertMessage');
    alertIcon = document.getElementById('alertIcon');
    togglePassword = document.getElementById('togglePassword');
    eyeIcon = document.getElementById('eyeIcon');
    serverIndicator = document.getElementById('serverIndicator');
    serverStatus = document.getElementById('serverStatus');
    connectionStatus = document.getElementById('connectionStatus');
}

// Password visibility toggle
function setupPasswordToggle() {
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'text') {
                eyeIcon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                `;
            } else {
                eyeIcon.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                `;
            }
        });
    }
}

// Check server status
async function checkServerStatus() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.status === 'online') {
            serverIndicator.className = 'w-2 h-2 rounded-full bg-green-400';
            serverStatus.textContent = `Server online (v${data.version})`;
            connectionStatus.classList.remove('hidden');
        } else {
            throw new Error('Server offline');
        }
    } catch (error) {
        serverIndicator.className = 'w-2 h-2 rounded-full bg-red-400';
        serverStatus.textContent = 'Server offline';
        connectionStatus.classList.add('hidden');
    }
}

// Show alert message
function showAlert(message, type = 'error') {
    alertMessage.textContent = message;
    alertContainer.className = `rounded-md p-4 mb-4 ${
        type === 'error' ? 'bg-red-50 text-red-800' : 
        type === 'success' ? 'bg-green-50 text-green-800' : 
        'bg-yellow-50 text-yellow-800'
    }`;
    
    alertIcon.className = `h-5 w-5 ${
        type === 'error' ? 'text-red-400' : 
        type === 'success' ? 'text-green-400' : 
        'text-yellow-400'
    }`;
    
    alertContainer.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertContainer.classList.add('hidden');
    }, 5000);
}

// Hide alert
function hideAlert() {
    alertContainer.classList.add('hidden');
}

// Set loading state
function setLoading(loading) {
    loginButton.disabled = loading;
    
    if (loading) {
        loginIcon.classList.add('hidden');
        loadingIcon.classList.remove('hidden');
        loginText.textContent = 'Signing in...';
        usernameInput.disabled = true;
        passwordInput.disabled = true;
    } else {
        loginIcon.classList.remove('hidden');
        loadingIcon.classList.add('hidden');
        loginText.textContent = 'Sign in';
        usernameInput.disabled = false;
        passwordInput.disabled = false;
    }
}

// Handle form submission
function setupFormSubmission() {
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            
            if (!username || !password) {
                showAlert('Please enter both username and password');
                return;
            }
            
            hideAlert();
            setLoading(true);
            
            try {
                const result = await window.authManager.login(username, password);
                
                if (result.success) {
                    showAlert('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = '/secure-dashboard.html';
                    }, 1000);
                } else {
                    showAlert(result.error || 'Login failed');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Login error:', error);
                showAlert('Network error. Please try again.');
                setLoading(false);
            }
        });
    }
}

// Forgot password placeholder (replaces onclick)
function showForgotPassword() {
    showAlert('Password reset functionality will be available soon.', 'info');
}

// Setup forgot password link
function setupForgotPasswordLink() {
    const forgotPasswordLink = document.querySelector('a[href="#"]');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPassword();
        });
    }
}

// Initialize page
function initializePage() {
    initializeDOMElements();
    setupPasswordToggle();
    setupFormSubmission();
    setupForgotPasswordLink();
    checkServerStatus();
    
    // Auto-focus username field
    if (usernameInput) {
        usernameInput.focus();
    }
    
    // Re-check server status every 30 seconds
    setInterval(checkServerStatus, 30000);
    
    console.log('🔐 Enhanced login page loaded');
}

// Wait for DOM and authManager to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for auth-manager.js to load
    setTimeout(initializePage, 100);
});
