// Dashboard Initialization - External File for CSP Compliance
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication status
  if (typeof DashboardAuth !== 'undefined') {
    if (DashboardAuth.checkAuth()) {
      // User is logged in, load dashboard
      DashboardAuth.loadDashboard();
    } else {
      // User needs to log in
      DashboardAuth.showLoginForm();
    }
  } else {
    console.error('DashboardAuth not loaded');
  }
});
