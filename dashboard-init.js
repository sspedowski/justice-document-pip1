// Dashboard Initialization - Safe and CSP Compliant
function waitForDashboardAuth(attempts = 10) {
  if (window.DashboardAuth && typeof window.DashboardAuth.checkAuth === "function") {
    console.debug("✅ DashboardAuth available – proceeding");
    initializeDashboard();
  } else if (attempts > 0) {
    console.warn("⏳ Waiting for DashboardAuth...");
    setTimeout(() => waitForDashboardAuth(attempts - 1), 200);
  } else {
    console.error("❌ DashboardAuth not loaded after multiple attempts.");
  }
}

function initializeDashboard() {
  console.debug("📦 Dashboard initializing...");

  const isAuthenticated = window.DashboardAuth.checkAuth();
  if (isAuthenticated) {
    console.debug("🔓 User authenticated – loading dashboard...");
    initializeJusticeDashboard();
  } else {
    console.debug("🔐 User not authenticated – showing login form...");
    showLoginForm();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  waitForDashboardAuth();
});
