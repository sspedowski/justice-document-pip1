/* login.js -- All login page JavaScript, CSP-safe */

document.addEventListener("DOMContentLoaded", function () {
  // Auth redirect if already logged in
  if (window.authManager && window.authManager.isAuthenticated()) {
    window.location.href = "/secure-dashboard.html";
    return;
  }

  // DOM elements
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginButton");
  const loginIcon = document.getElementById("loginIcon");
  const loadingIcon = document.getElementById("loadingIcon");
  const loginText = document.getElementById("loginText");
  const alertContainer = document.getElementById("alertContainer");
  const alertMessage = document.getElementById("alertMessage");
  const alertIcon = document.getElementById("alertIcon");
  const togglePassword = document.getElementById("togglePassword");
  const eyeIcon = document.getElementById("eyeIcon");
  const serverIndicator = document.getElementById("serverIndicator");
  const serverStatus = document.getElementById("serverStatus");
  const connectionStatus = document.getElementById("connectionStatus");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");

  // Password visibility toggle
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      if (type === "text") {
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

  // Forgot password event
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (e) {
      e.preventDefault();
      showAlert("Password reset functionality will be available soon.", "info");
    });
  }

  // Login form submit
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      loginButton.disabled = true;

      // Use CSS classes instead of inline styles
      loginIcon.classList.add("hidden");
      loadingIcon.classList.remove("hidden");
      loginText.textContent = "Logging in...";

      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      if (!username || !password) {
        showAlert("Please enter your username and password.", "error");
        resetButton();
        return;
      }

      try {
        const result = await window.authManager.login(username, password);
        if (result.success) {
          window.location.href = "/secure-dashboard.html";
        } else {
          showAlert(result.error || "Login failed.", "error");
          resetButton();
        }
      } catch (err) {
        showAlert("Network error during login.", "error");
        resetButton();
      }
    });
  }

  // Helper functions
  function resetButton() {
    loginButton.disabled = false;
    loginIcon.classList.remove("hidden");
    loadingIcon.classList.add("hidden");
    loginText.textContent = "Login";
  }

  function showAlert(message, type) {
    if (!alertContainer || !alertMessage || !alertIcon) return;
    alertContainer.classList.remove("hidden");
    alertMessage.textContent = message;
    if (type === "error") {
      alertContainer.className =
        "rounded bg-red-100 border border-red-300 text-red-800 px-4 py-2 mb-2 flex items-center";
      alertIcon.innerHTML = `<svg class="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03 9-9 9-9 9z"></path></svg>`;
    } else {
      alertContainer.className =
        "rounded bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 mb-2 flex items-center";
      alertIcon.innerHTML = `<svg class="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01"></path></svg>`;
    }
  }

  // Hide alerts on input
  [usernameInput, passwordInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener("input", function () {
      if (alertContainer) alertContainer.classList.add("hidden");
    });
  });

  // Auto-focus username
  if (usernameInput) usernameInput.focus();

  // Server status
  async function checkServerStatus() {
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      if (data.status === "online") {
        if (serverIndicator)
          serverIndicator.className = "w-2 h-2 rounded-full bg-green-400";
        if (serverStatus) serverStatus.textContent = "Server Online";
        if (connectionStatus) connectionStatus.textContent = "";
      } else {
        if (serverIndicator)
          serverIndicator.className = "w-2 h-2 rounded-full bg-yellow-400";
        if (serverStatus) serverStatus.textContent = "Server Issue";
        if (connectionStatus) connectionStatus.textContent = "API error";
      }
    } catch (err) {
      if (serverIndicator)
        serverIndicator.className = "w-2 h-2 rounded-full bg-red-400";
      if (serverStatus) serverStatus.textContent = "Server Offline";
      if (connectionStatus) connectionStatus.textContent = "API unreachable";
    }
  }
  checkServerStatus();
  setInterval(checkServerStatus, 30000);

  // ChatGPT's exact guest login code
  document
    .getElementById("guestLoginBtn")
    .addEventListener("click", async function () {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "guest",
          password: "guest123",
        }),
      });
      if (response.ok) {
        window.location.href = "/secure-dashboard.html"; // Your dashboard route
      } else {
        alert("Guest login failed!");
      }
    });
});
// Demo credentials: guest/guest123
// See README for security warning
