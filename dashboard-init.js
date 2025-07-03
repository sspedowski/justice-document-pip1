// Dashboard Initialization - Safe and CSP Compliant
window.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard initializing...');
  
  // Wait a moment for all scripts to load
  setTimeout(function() {
    if (typeof DashboardAuth !== 'undefined' && DashboardAuth.checkAuth) {
      console.log('DashboardAuth loaded, checking authentication...');
      
      try {
        if (DashboardAuth.checkAuth()) {
          console.log('User authenticated, loading dashboard...');
          DashboardAuth.loadDashboard();
        } else {
          console.log('User not authenticated, showing login form...');
          DashboardAuth.showLoginForm();
        }
      } catch (error) {
        console.error('Error during authentication check:', error);
        // Fallback: show login form
        DashboardAuth.showLoginForm();
      }
    } else {
      console.error('DashboardAuth not loaded or missing checkAuth method');
      // Show a basic error message
      document.getElementById('app').innerHTML = `
        <div class="min-h-screen flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-red-600 mb-4">Loading Error</h1>
            <p class="text-gray-600">Please refresh the page</p>
          </div>
        </div>
      `;
    }
  }, 100);
});
