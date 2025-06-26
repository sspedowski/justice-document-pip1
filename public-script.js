// 📂 public-script.js
document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('fileInput');
  const summaryOutput = document.getElementById('summaryOutput');
  const fileLink = document.getElementById('fileLink');
  const loadingIndicator = document.getElementById('loading');

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
      alert('Please select a PDF file to upload.');
      return;
    }

    // Show loading
    summaryOutput.textContent = '';
    loadingIndicator.style.display = 'inline-block';

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to summarize PDF');
      }

      const result = await response.json();

      summaryOutput.textContent = result.summary || 'No summary returned.';
      fileLink.href = result.fileURL;
      fileLink.textContent = `📎 View Uploaded File (${result.fileName})`;
      fileLink.style.display = 'inline';

    } catch (err) {
      console.error('❌ Error uploading/summarizing:', err);
      summaryOutput.textContent = 'Something went wrong while processing the PDF.';
    } finally {
      loadingIndicator.style.display = 'none';
    }
  });
});
// 📂 public-script.js