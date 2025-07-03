// PDF.js Configuration - Local Setup Only
window.addEventListener('DOMContentLoaded', function() {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
    console.log('PDF.js configured with local worker');
  } else {
    console.error('PDF.js not loaded');
  }
});
