// Justice Dashboard Debug Script - Load Order and DOM State Tracer
console.log('🔍 DEBUG: Justice Dashboard starting initialization...');

// Check if this script loads
console.log('✅ DEBUG: debug-tracer.js loaded successfully');

// DOM Ready Handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DEBUG: DOMContentLoaded event fired');
    
    // Check DOM elements
    const app = document.getElementById('app');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const notifications = document.getElementById('notifications');
    
    console.log('🔍 DEBUG: DOM Element Check:');
    console.log('  - #app element:', app ? '✅ EXISTS' : '❌ MISSING');
    console.log('  - #darkModeToggle element:', darkModeToggle ? '✅ EXISTS' : '❌ MISSING');
    console.log('  - #notifications element:', notifications ? '✅ EXISTS' : '❌ MISSING');
    
    // Check global objects
    console.log('🔍 DEBUG: Global Objects Check:');
    console.log('  - window.DashboardAuth:', typeof window.DashboardAuth !== 'undefined' ? '✅ LOADED' : '❌ MISSING');
    console.log('  - window.pdfjsLib:', typeof window.pdfjsLib !== 'undefined' ? '✅ LOADED' : '❌ MISSING');
    
    // Check CSS loading
    const computedStyle = window.getComputedStyle(document.body);
    const backgroundImage = computedStyle.backgroundImage;
    const backgroundColor = computedStyle.backgroundColor;
    
    console.log('🔍 DEBUG: CSS Loading Check:');
    console.log('  - Body background:', backgroundImage || backgroundColor || 'DEFAULT');
    console.log('  - Faith gradient applied:', backgroundImage.includes('gradient') ? '✅ YES' : '❌ NO');
    
    // Test app container functionality
    if (app) {
        console.log('✅ DEBUG: App container found - testing functionality');
        // Use class instead of inline style (CSP compliant)
        const testDiv = document.createElement('div');
        testDiv.className = 'debug-message'; // Add a class instead of using style attribute
        testDiv.innerHTML = `
            <h2 class="debug-message-title">🎯 DEBUG: App Container Working!</h2>
            <p class="debug-message-body">Justice Dashboard initialization successful</p>
            <p class="debug-message-footer">This debug message confirms the app container is functional</p>
        `;
        app.appendChild(testDiv);
        console.log('✅ DEBUG: Test content added to app container');
    } else {
        console.error('❌ DEBUG: CRITICAL ERROR - App container not found!');
    }

    // Check for script loading errors
    window.addEventListener('error', function(e) {
        console.error('❌ DEBUG: Script loading error:', {
            message: e.message,
            source: e.filename,
            line: e.lineno,
            column: e.colno
        });
    });

    // Binding upload and lawyer event handlers
    console.log('🔍 Binding upload and lawyer event handlers...');
    const uploadBtn = document.getElementById('uploadBtn');
    const lawyerBtn = document.getElementById('lawyerBtn');
    console.log('Upload button:', !!uploadBtn);
    console.log('Lawyer button:', !!lawyerBtn);

    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            console.log('✅ Upload button clicked!');
            // Add your upload logic here
        });
    }
    if (lawyerBtn) {
        lawyerBtn.addEventListener('click', function() {
            console.log('✅ Lawyer button clicked!');
            // Add your lawyer logic here
        });
    }
});
