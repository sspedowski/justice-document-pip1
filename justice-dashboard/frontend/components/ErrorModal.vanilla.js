/**
 * ErrorModal - Vanilla JavaScript version for reporting errors
 * Creates a modal dialog to display errors and submit error reports
 */

class ErrorModal {
  constructor() {
    this.isOpen = false;
    this.currentError = null;
    this.currentDocumentId = null;
    this.modalElement = null;
    this.createModal();
  }

  createModal() {
    // Create modal HTML structure
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'error-modal-overlay';
    this.modalElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      padding: 1rem;
    `;

    this.modalElement.innerHTML = `
      <div class="error-modal-content" style="
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      ">
        <h3 style="
          color: #dc2626;
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        ">Error Occurred</h3>
        
        <p class="error-message" style="
          color: #374151;
          margin: 0 0 1.5rem 0;
          line-height: 1.5;
        "></p>
        
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button class="close-btn" style="
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 0.5rem 1rem;
          ">Close</button>
          
          <button class="submit-btn" style="
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.5rem 1rem;
            cursor: pointer;
          ">Submit Error Report</button>
        </div>
        
        <div class="status-message" style="
          margin-top: 0.75rem;
          font-size: 0.875rem;
          display: none;
        "></div>
      </div>
    `;

    // Add event listeners
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.close();
      }
    });

    this.modalElement.querySelector('.close-btn').addEventListener('click', () => {
      this.close();
    });

    this.modalElement.querySelector('.submit-btn').addEventListener('click', () => {
      this.submitErrorReport();
    });

    // Add to document
    document.body.appendChild(this.modalElement);
  }

  show(error, documentId = null) {
    this.currentError = error;
    this.currentDocumentId = documentId;
    this.isOpen = true;

    // Update modal content
    this.modalElement.querySelector('.error-message').textContent = error;
    this.modalElement.querySelector('.status-message').style.display = 'none';
    
    // Show modal
    this.modalElement.style.display = 'flex';
    
    // Reset submit button
    const submitBtn = this.modalElement.querySelector('.submit-btn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Error Report';
    submitBtn.style.background = '#2563eb';
  }

  close() {
    this.isOpen = false;
    this.modalElement.style.display = 'none';
    this.currentError = null;
    this.currentDocumentId = null;
  }

  async submitErrorReport() {
    const submitBtn = this.modalElement.querySelector('.submit-btn');
    const statusDiv = this.modalElement.querySelector('.status-message');
    
    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    submitBtn.style.background = '#9ca3af';
    statusDiv.style.display = 'none';

    try {
      const response = await fetch('/api/report-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorMessage: this.currentError,
          documentId: this.currentDocumentId,
          context: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit error report');
      }

      // Show success message
      statusDiv.textContent = 'Error reported successfully!';
      statusDiv.style.color = '#059669';
      statusDiv.style.display = 'block';

      // Close modal after 2 seconds
      setTimeout(() => {
        this.close();
      }, 2000);

    } catch (err) {
      console.error('Error submitting report:', err);
      
      // Show error message
      statusDiv.textContent = 'Failed to submit error report. Please try again.';
      statusDiv.style.color = '#dc2626';
      statusDiv.style.display = 'block';

      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Error Report';
      submitBtn.style.background = '#2563eb';
    }
  }

  destroy() {
    if (this.modalElement && this.modalElement.parentNode) {
      this.modalElement.parentNode.removeChild(this.modalElement);
    }
  }
}

// Create global instance
window.errorModal = new ErrorModal();

// Utility function to show error modal
window.showError = (error, documentId = null) => {
  window.errorModal.show(error, documentId);
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorModal;
}
