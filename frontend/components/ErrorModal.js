```javascript
import React from 'react';
import './ErrorModal.css';

const ErrorModal = ({ errorMessage, onClose }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <p>{errorMessage}</p>
      </div>
    </div>
  );
};

export default ErrorModal;
```