// PDF.js Configuration - Local Setup Only
window.addEventListener("DOMContentLoaded", function () {
  console.log("🔧 Configuring PDF.js...");

  if (typeof pdfjsLib !== "undefined") {
    console.log("✅ PDF.js library loaded successfully");
    console.log("📚 PDF.js version:", pdfjsLib.version);

    pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.min.js";
    console.log(
      "⚙️ PDF.js worker configured:",
      pdfjsLib.GlobalWorkerOptions.workerSrc,
    );

    // Ensure global access
    window.pdfjsLib = pdfjsLib;
    console.log("🌐 PDF.js available globally as window.pdfjsLib");
  } else {
    console.error("❌ PDF.js library not found during configuration");
  }
});
