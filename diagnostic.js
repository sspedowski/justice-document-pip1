// Dashboard Diagnostic Script
console.log('🔍 DASHBOARD DIAGNOSTIC STARTING...');

// Check if DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Content Loaded');
    
    // Check for required elements
    const app = document.getElementById('app');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    console.log('🔍 App element:', app ? '✅ Found' : '❌ Missing');
    console.log('🔍 Dark Mode Toggle:', darkModeToggle ? '✅ Found' : '❌ Missing');
    
    // Check for required global objects
    console.log('🔍 DashboardAuth:', typeof window.DashboardAuth !== 'undefined' ? '✅ Available' : '❌ Missing');
    
    // Check CSS loading
    const computedStyle = window.getComputedStyle(document.body);
    console.log('🔍 Body background:', computedStyle.background || computedStyle.backgroundColor);
    
    // Test basic functionality
    if (app) {
        console.log('✅ App container found - attempting to add test content');
        const testDiv = document.createElement('div');
        testDiv.innerHTML = '<h2 style="color: #BA9930; text-align: center;">🎯 DIAGNOSTIC: Dashboard Loading Test</h2>';
        testDiv.style.background = 'white';
        testDiv.style.padding = '20px';
        testDiv.style.margin = '20px';
        testDiv.style.borderRadius = '10px';
        testDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        app.appendChild(testDiv);
    }
    
    console.log('🔍 DIAGNOSTIC COMPLETE');
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('❌ GLOBAL ERROR:', e.error);
    console.error('❌ Error details:', e.filename, e.lineno, e.colno);
});

console.log('🔍 Diagnostic script loaded');
