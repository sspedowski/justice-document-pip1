// PDF.js Configuration - External File for CSP Compliance
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
}
