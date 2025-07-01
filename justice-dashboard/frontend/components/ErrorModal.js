import { useState } from 'react';

const ErrorModal = ({ isOpen, onClose, error, documentId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/report-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorMessage: error,
          documentId,
          context: window.location.href
        }),
      });

      if (!response.ok) throw new Error('Failed to submit error report');
      
      setSubmitStatus('success');
      setTimeout(onClose, 2000); // Close modal after 2 seconds
    } catch (err) {
      console.error('Error submitting report:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Error Occurred</h3>
        <p className="text-gray-700 mb-4">{error}</p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded transition-colors ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Error Report'}
          </button>
        </div>
        
        {submitStatus === 'success' && (
          <p className="mt-3 text-green-600 text-sm">Error reported successfully!</p>
        )}
        {submitStatus === 'error' && (
          <p className="mt-3 text-red-600 text-sm">Failed to submit error report. Please try again.</p>
        )}
      </div>
    </div>
  );
};

export default ErrorModal;
