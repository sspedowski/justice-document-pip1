// Justice Dashboard Debug Script - Load Order and DOM State Tracer
console.log('🔍 DEBUG: Justice Dashboard starting initialization...');

// Confirm debug script loads
console.log('✅ DEBUG: debug-tracer.js loaded successfully');

// DOM Ready Handler
// All logic runs after DOM is loaded
// (but NOT after dynamic JS-injected elements - see note below)
document.addEventListener('DOMContentLoaded', function() {
    // 1. DOM structure sanity checks
    console.log('✅ DEBUG: DOMContentLoaded event fired');
    const app = document.getElementById('app');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const notifications = document.getElementById('notifications');
    console.log('🔍 DEBUG: DOM Element Check:');
    console.log('  - #app element:', app ? '✅ EXISTS' : '❌ MISSING');
    console.log('  - #darkModeToggle element:', darkModeToggle ? '✅ EXISTS' : '❌ MISSING');
    console.log('  - #notifications element:', notifications ? '✅ EXISTS' : '❌ MISSING');

    // 2. Global object check
    console.log('🔍 DEBUG: Global Objects Check:');
    console.log('  - window.DashboardAuth:', typeof window.DashboardAuth !== 'undefined' ? '✅ LOADED' : '❌ MISSING');
    console.log('  - window.pdfjsLib:', typeof window.pdfjsLib !== 'undefined' ? '✅ LOADED' : '❌ MISSING');

    // 3. CSS/branding check
    const computedStyle = window.getComputedStyle(document.body);
    const backgroundImage = computedStyle.backgroundImage;
    const backgroundColor = computedStyle.backgroundColor;
    console.log('🔍 DEBUG: CSS Loading Check:');
    console.log('  - Body background:', backgroundImage || backgroundColor || 'DEFAULT');
    console.log('  - Faith gradient applied:', backgroundImage.includes('gradient') ? '✅ YES' : '❌ NO');

    // 4. App container test
    if (app) {
        console.log('✅ DEBUG: App container found - testing functionality');
        // Add visible debug box for visual confirmation
        const testDiv = document.createElement('div');
        testDiv.className = 'debug-message';
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

    // 5. Fatal JS error trace
    window.addEventListener('error', function(e) {
        console.error('❌ DEBUG: Script loading error:', {
            message: e.message,
            source: e.filename,
            line: e.lineno,
            column: e.colno
        });
    });

    // 6. BUTTON EVENT DEBUGGING (STATIC ONLY)
    // This will ONLY work if buttons exist in DOM at page load time.
    console.log('🔍 Binding upload and lawyer event handlers...');
    const uploadBtn = document.getElementById('uploadBtn');
    const lawyerBtn = document.getElementById('lawyerBtn');
    console.log('Upload button:', !!uploadBtn);
    console.log('Lawyer button:', !!lawyerBtn);

    // Attach click handlers if buttons exist at load
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            console.log('✅ Upload button clicked!');
            alert('Upload button was clicked!');
        });
    }
    if (lawyerBtn) {
        lawyerBtn.addEventListener('click', function() {
            console.log('✅ Lawyer button clicked!');
            alert('Lawyer button was clicked!');
        });
    }

    // 7. NOTE: If you load buttons *dynamically* (AJAX or render after DOMContentLoaded),
    // then these handlers WILL NOT WORK unless you:
    //  (a) re-run this code after rendering the buttons
    //  (b) OR use event delegation (advanced, ask if needed)
});
