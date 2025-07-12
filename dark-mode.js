// Dark Mode Toggle for Justice Dashboard
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const icon = darkModeToggle.querySelector('i');
    
    // Check for saved dark mode preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    if (isDarkMode) {
        body.classList.add('dark-mode');
        icon.className = 'fas fa-sun';
    }
    
    darkModeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        
        // Update icon
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        
        // Save preference
        localStorage.setItem('darkMode', isDark);
    });
});
