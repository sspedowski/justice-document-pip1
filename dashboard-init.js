// Dashboard Initialization - Safe and CSP Compliant
window.addEventListener("DOMContentLoaded", function () {
  console.log("Dashboard initializing...");
  console.log("App div exists?", !!document.getElementById("app"));

  // Wait a moment for all scripts to load
  setTimeout(function () {
    console.log("Checking for DashboardAuth...");
    console.log("DashboardAuth exists?", typeof DashboardAuth !== "undefined");
    console.log(
      "checkAuth method exists?",
      typeof DashboardAuth !== "undefined" &&
        typeof DashboardAuth.checkAuth === "function",
    );

    if (typeof DashboardAuth !== "undefined" && DashboardAuth.checkAuth) {
      console.log("DashboardAuth loaded, checking authentication...");

      try {
        if (DashboardAuth.checkAuth()) {
          console.log("User authenticated, loading dashboard...");
          DashboardAuth.loadDashboard();
        } else {
          console.log("User not authenticated, showing login form...");
          DashboardAuth.showLoginForm();
        }
      } catch (error) {
        console.error("Error during authentication check:", error);
        // Fallback: show login form
        console.log("Fallback: attempting to show login form...");
        if (
          typeof DashboardAuth !== "undefined" &&
          DashboardAuth.showLoginForm
        ) {
          DashboardAuth.showLoginForm();
        }
      }
    } else {
      console.error("DashboardAuth not loaded or missing checkAuth method");
      console.log("App div still exists?", !!document.getElementById("app"));

      // Show a basic error message
      const appDiv = document.getElementById("app");
      if (appDiv) {
        appDiv.innerHTML = `
          <div class="min-h-screen flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-2xl font-bold text-red-600 mb-4">Loading Error</h1>
              <p class="text-gray-600">DashboardAuth not loaded. Please refresh the page</p>
            </div>
          </div>
        `;
      } else {
        console.error("App div not found in fallback error handler!");
      }
    }
  }, 100);
});
