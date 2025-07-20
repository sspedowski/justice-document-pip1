/**
 * Enhanced Authentication Manager for Justice Dashboard
 * Handles JWT tokens, automatic refresh, and user session management
 */

class AuthManager {
  constructor() {
    this.token = localStorage.getItem("justice_token");
    this.refreshTimer = null;
    this.tokenExpiry = localStorage.getItem("justice_token_expiry");
    this.user = this.getStoredUser();

    // Start token refresh timer if we have a valid token
    if (this.token && this.tokenExpiry) {
      this.startRefreshTimer();
    }
  }

  getStoredUser() {
    const userData = localStorage.getItem("justice_user");
    return userData ? JSON.parse(userData) : null;
  }

  setStoredUser(user) {
    localStorage.setItem("justice_user", JSON.stringify(user));
    this.user = user;
  }

  clearStoredUser() {
    localStorage.removeItem("justice_user");
    this.user = null;
  }

  isAuthenticated() {
    return !!(this.token && this.user);
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async login(username, password) {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        this.token = data.token;
        localStorage.setItem("justice_token", this.token);

        // Calculate token expiry (23.5 hours from now, refresh before expiry)
        const expiryTime = Date.now() + 23.5 * 60 * 60 * 1000;
        this.tokenExpiry = expiryTime;
        localStorage.setItem("justice_token_expiry", expiryTime.toString());

        // Fetch and store user profile
        await this.fetchUserProfile();

        // Start refresh timer
        this.startRefreshTimer();

        return { success: true, user: this.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error during login" };
    }
  }

  async logout() {
    try {
      // Call server logout endpoint
      await fetch("/api/logout", {
        method: "POST",
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      // Clear local data regardless of server response
      this.clearSession();
    }
  }

  clearSession() {
    this.token = null;
    this.tokenExpiry = null;
    this.clearStoredUser();
    localStorage.removeItem("justice_token");
    localStorage.removeItem("justice_token_expiry");

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async fetchUserProfile() {
    try {
      const response = await fetch("/api/profile", {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.setStoredUser(data.profile);
          return data.profile;
        }
      }
      return null;
    } catch (error) {
      console.error("Profile fetch error:", error);
      return null;
    }
  }

  async refreshToken() {
    try {
      const response = await fetch("/api/refresh-token", {
        method: "POST",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        this.token = data.token;
        localStorage.setItem("justice_token", this.token);

        // Update expiry time
        const expiryTime = Date.now() + 23.5 * 60 * 60 * 1000;
        this.tokenExpiry = expiryTime;
        localStorage.setItem("justice_token_expiry", expiryTime.toString());

        console.log("✅ Token refreshed successfully");
        this.startRefreshTimer();
        return true;
      } else {
        console.error("Token refresh failed:", data.error);
        this.clearSession();
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      this.clearSession();
      return false;
    }
  }

  startRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.tokenExpiry) return;

    const now = Date.now();
    const expiry = parseInt(this.tokenExpiry);
    const refreshTime = expiry - 30 * 60 * 1000; // Refresh 30 minutes before expiry

    if (refreshTime <= now) {
      // Token expired or expires very soon, refresh immediately
      this.refreshToken();
    } else {
      // Set timer to refresh token
      const timeUntilRefresh = refreshTime - now;
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, timeUntilRefresh);

      console.log(
        `🔄 Token refresh scheduled in ${Math.round(timeUntilRefresh / 60000)} minutes`,
      );
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders(),
      },
    };

    try {
      const response = await fetch(url, authOptions);

      // Handle token expiry
      if (response.status === 401) {
        const data = await response.json();
        if (data.code === "TOKEN_EXPIRED") {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry request with new token
            authOptions.headers = {
              ...authOptions.headers,
              ...this.getAuthHeaders(),
            };
            return fetch(url, authOptions);
          }
        }
        // If refresh failed or other 401 error, clear session
        this.clearSession();
        window.location.href = "/login.html";
      }

      return response;
    } catch (error) {
      console.error("Authenticated request error:", error);
      throw error;
    }
  }

  // Utility method for checking authentication status
  async checkAuthStatus() {
    try {
      const response = await fetch("/api/health", {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return data.authentication === "authenticated";
    } catch (error) {
      console.error("Auth status check failed:", error);
      return false;
    }
  }

  // User session monitoring (admin only)
  async getUserSessions() {
    if (!this.user || this.user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const response = await this.makeAuthenticatedRequest("/api/user-sessions");
    const data = await response.json();

    if (data.success) {
      return data.sessions;
    } else {
      throw new Error(data.error);
    }
  }

  // Password change functionality
  async changePassword(currentPassword, newPassword) {
    const response = await this.makeAuthenticatedRequest(
      "/api/change-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      },
    );

    const data = await response.json();
    return data;
  }
}

// Global auth manager instance
window.authManager = new AuthManager();

// Auto-redirect if not authenticated (for protected pages)
function requireAuth() {
  if (!window.authManager.isAuthenticated()) {
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

// Initialize authentication status display
function updateAuthDisplay() {
  const user = window.authManager.user;
  const authElements = document.querySelectorAll("[data-auth-user]");
  const loginElements = document.querySelectorAll("[data-auth-login]");
  const logoutElements = document.querySelectorAll("[data-auth-logout]");

  if (user) {
    authElements.forEach((el) => {
      if (el.dataset.authUser === "username") {
        el.textContent = user.username;
      } else if (el.dataset.authUser === "role") {
        el.textContent = user.role;
      }
      el.classList.remove("hidden");
    });

    loginElements.forEach((el) => el.classList.add("hidden"));
    logoutElements.forEach((el) => el.classList.remove("hidden"));
  } else {
    authElements.forEach((el) => el.classList.add("hidden"));
    loginElements.forEach((el) => el.classList.remove("hidden"));
    logoutElements.forEach((el) => el.classList.add("hidden"));
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  updateAuthDisplay();

  // Set up logout buttons
  document.querySelectorAll("[data-auth-logout]").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      await window.authManager.logout();
      updateAuthDisplay();
      window.location.href = "/login.html";
    });
  });
});

console.log("🔐 Enhanced Authentication Manager loaded");

// Password reset feature: Coming soon (see README)
