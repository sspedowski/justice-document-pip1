// Dashboard Initialization - Safe and CSP Compliant
document.addEventListener("DOMContentLoaded", () => {
  console.debug("Dashboard initializing...");

  const app = document.getElementById("app");
  console.debug("App div exists?", !!app);

  // Ensure window.DashboardAuth is available and functional
  if (window.DashboardAuth && typeof window.DashboardAuth.checkAuth === "function") {
    console.debug("DashboardAuth exists:", true);
    console.debug("checkAuth method exists:", true);

    const isAuthenticated = window.DashboardAuth.checkAuth();
    if (isAuthenticated) {
      console.debug("DashboardAuth loaded, checking authentication...");
      initializeJusticeDashboard();
    } else {
      console.debug("User not authenticated, showing login form...");
      showLoginForm();
    }
  } else {
    console.warn("DashboardAuth not loaded or missing checkAuth method");
  }

  console.debug("App div still exists?", !!app);
});
