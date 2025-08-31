/**
 * Enhanced Authentication Manager for Justice Dashboard
 * Handles JWT tokens, automatic refresh, and user session management
 */

// Note: Avoid importing a separate authFetch helper here to prevent cycles.
// Instead, attach auth + CSRF headers directly when making requests.
function withAuthAndCsrf(init = {}, getAuthHeadersFn, getCsrfTokenFn) {
  const csrf = typeof getCsrfTokenFn === 'function' ? getCsrfTokenFn() : null;
  const base = typeof getAuthHeadersFn === 'function' ? getAuthHeadersFn() : {};
  const headers = {
    ...base,
    ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    ...(init.headers || {}),
  };
  return { ...init, headers, credentials: init.credentials || 'include' };
}

class AuthManager {
  constructor() {
    // For security, do NOT persist JWTs in localStorage. Prefer HttpOnly secure cookies
    // set by the server or keep tokens in-memory. We keep minimal user info in sessionStorage
    // (cleared when the tab/window closes) to reduce exposure to XSS.
    this.token = null; // in-memory only by default
    this.refreshTimer = null;
    this.tokenExpiry = null;
    this.user = this.getStoredUser();

    // Start token refresh timer if a token and expiry are available (e.g., after login)
    if (this.token && this.tokenExpiry) {
      this.startRefreshTimer();
    }
  }

  getStoredUser() {
    // Use sessionStorage for non-sensitive user metadata to limit persistence.
    try {
      const userData = sessionStorage.getItem("justice_user");
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.warn("Failed to parse stored user data", e);
      return null;
    }
  }

  setStoredUser(user) {
    // Store only minimal, non-sensitive user fields in sessionStorage.
    const safeUser = {
      username: user && user.username,
      role: user && user.role,
    };
    try {
      sessionStorage.setItem("justice_user", JSON.stringify(safeUser));
    } catch (e) {
      console.warn("Failed to store user in sessionStorage", e);
    }
    this.user = safeUser;
  }

  clearStoredUser() {
    sessionStorage.removeItem("justice_user");
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
      const response = await fetch(
        "/api/login",
        withAuthAndCsrf(
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          },
          this.getAuthHeaders.bind(this),
          this.getCsrfToken.bind(this)
        )
      );

      const data = await response.json();

      if (data.success) {
  // Keep token in-memory. If you need persistence across tabs, implement a
  // server-side HttpOnly secure cookie (endpoint /api/set-token-cookie) and
  // call it from here. Avoid storing JWTs in localStorage to reduce XSS impact.
  this.setToken(data.token);

  // Calculate and store expiry in memory
  const expiryTime = Date.now() + 23.5 * 60 * 60 * 1000;
  this.tokenExpiry = expiryTime;

  // Fetch and store minimal user profile (session-only)
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
      await fetch(
        "/api/logout",
        withAuthAndCsrf(
          {
            method: "POST",
          },
          this.getAuthHeaders.bind(this),
          this.getCsrfToken.bind(this)
        )
      );
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      // Clear local data regardless of server response
      this.clearSession();
    }
  }

  clearSession() {
  this.clearTokenStorage();
  this.tokenExpiry = null;
  this.clearStoredUser();

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async fetchUserProfile() {
    try {
      const response = await fetch(
        "/api/profile",
        withAuthAndCsrf(
          {},
          this.getAuthHeaders.bind(this),
          this.getCsrfToken.bind(this)
        )
      );

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
      const response = await fetch(
        "/api/refresh-token",
        withAuthAndCsrf(
          { method: "POST" },
          this.getAuthHeaders.bind(this),
          this.getCsrfToken.bind(this)
        )
      );

      const data = await response.json();

      if (data.success) {
        // Replace in-memory token and update expiry
        this.setToken(data.token);
        const expiryTime = Date.now() + 23.5 * 60 * 60 * 1000;
        this.tokenExpiry = expiryTime;

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

  // Store token in-memory and optionally to sessionStorage (non-persistent across browser restarts).
  // Prefer server-set HttpOnly cookie for cross-tab persistence and XSS protection.
  setToken(token, { persist = false } = {}) {
    this.token = token;
    if (persist) {
      try {
        sessionStorage.setItem("justice_token", token);
        // Storing tokens in sessionStorage is less persistent than localStorage but still
        // accessible to JS. For best security, implement a server endpoint to set
        // an HttpOnly secure cookie instead and call it here (e.g. POST /api/set-token-cookie).
      } catch (e) {
        console.warn("Failed to persist token to sessionStorage", e);
      }
    }
  }

  clearTokenStorage() {
    this.token = null;
    try {
      sessionStorage.removeItem("justice_token");
    } catch (e) {
      /* ignore */
    }
  }

  // Helper: include CSRF token for state-changing requests when available
  getCsrfToken() {
    try {
      const el = document.querySelector('meta[name="csrf-token"]');
      return el ? el.getAttribute('content') : null;
    } catch (e) {
      return null;
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
    const authOptions = withAuthAndCsrf(
      options,
      this.getAuthHeaders.bind(this),
      this.getCsrfToken.bind(this)
    );

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
            return fetch(url, withAuthAndCsrf(
              authOptions,
              this.getAuthHeaders.bind(this),
              this.getCsrfToken.bind(this)
            ));
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
      const response = await fetch(
        "/api/health",
        withAuthAndCsrf(
          {},
          this.getAuthHeaders.bind(this),
          this.getCsrfToken.bind(this)
        )
      );

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

// Named exports for module consumers (ESM-friendly). Keep globals for legacy scripts.
export function getToken() {
  return window.authManager.token;
}

export function refreshToken() {
  return window.authManager.refreshToken();
}

export function getCsrfToken() {
  return window.authManager.getCsrfToken();
}

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
