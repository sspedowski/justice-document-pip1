// Dark Mode Toggle for Justice Dashboard - CSP Compliant
document.addEventListener("DOMContentLoaded", function () {
  console.log("Dark mode script initializing...");

  // Safeguard: Check if toggle button exists
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (!darkModeToggle) {
    console.warn(
      "Dark mode toggle button (#darkModeToggle) not found in DOM. Skipping dark mode initialization.",
    );
    return;
  }

  const body = document.body;
  const icon = darkModeToggle.querySelector(".icon-moon, .icon-sun");

  // Check for saved dark mode preference
  const savedTheme = localStorage.getItem("justice_theme");
  const isDarkMode = savedTheme === "dark";

  // Apply saved theme
  if (isDarkMode) {
    body.setAttribute("data-theme", "dark");
    body.classList.add("dark-mode");
    if (icon) {
      icon.className = "icon-sun";
    }
    darkModeToggle.innerHTML = "☀️ Light Mode";
  } else {
    body.setAttribute("data-theme", "");
    body.classList.remove("dark-mode");
    if (icon) {
      icon.className = "icon-moon";
    }
    darkModeToggle.innerHTML = "🌙 Dark Mode";
  }

  // Toggle functionality
  darkModeToggle.addEventListener("click", function () {
    const currentTheme = body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "" : "dark";

    // Update theme
    body.setAttribute("data-theme", newTheme);

    if (newTheme === "dark") {
      body.classList.add("dark-mode");
      darkModeToggle.innerHTML = "☀️ Light Mode";
    } else {
      body.classList.remove("dark-mode");
      darkModeToggle.innerHTML = "🌙 Dark Mode";
    }

    // Save preference
    localStorage.setItem("justice_theme", newTheme);
    console.log("Theme switched to:", newTheme || "light");
  });

  console.log(
    "Dark mode initialized successfully. Current theme:",
    savedTheme || "light",
  );
});
