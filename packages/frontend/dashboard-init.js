// Dashboard Initialization - Safe and CSP Compliant
function waitForDashboardAuth(attempts = 20) {
  if (window.DashboardAuth && typeof window.DashboardAuth.checkAuth === "function") {
    console.debug("✅ DashboardAuth available – proceeding");
    initializeDashboard();
  } else if (attempts > 0) {
    console.warn(`⏳ Waiting for DashboardAuth... (${attempts} attempts left)`);
    setTimeout(() => waitForDashboardAuth(attempts - 1), 100);
  } else {
    console.error("❌ DashboardAuth not loaded after multiple attempts.");
    console.error("Available on window:", Object.keys(window).filter(k => k.includes('Dashboard')));
  }
}

function initializeDashboard() {
  console.debug("📦 Dashboard initializing...");

  try {
    const isAuthenticated = window.DashboardAuth.checkAuth();
    if (isAuthenticated) {
      console.debug("🔓 User authenticated – loading dashboard...");
      if (typeof window.initializeJusticeDashboard === 'function') {
        window.initializeJusticeDashboard();
      } else {
        console.error('initializeJusticeDashboard() not available on window');
      }
    } else {
      console.debug("🔐 User not authenticated – showing login form...");
      if (typeof window.showLoginForm === 'function') {
        window.showLoginForm();
      } else {
        console.error('showLoginForm() not available on window');
      }
    }
  } catch (error) {
    console.error("❌ Dashboard initialization error:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  waitForDashboardAuth();
});
