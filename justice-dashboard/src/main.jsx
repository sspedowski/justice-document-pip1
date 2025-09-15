import * as React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';
// development-friendly object pretty-printer (no-op in production)
import '../../frontend/debug-tracer.js';

// Provide a React global for any dev overlays or third-party scripts that expect it.
if (typeof window !== 'undefined' && !('React' in window)) {
  // Assign the namespace import so overlays relying on window.React don’t crash.
  window.React = React;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
