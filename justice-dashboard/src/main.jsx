import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';
// Dev-only shim: expose React and ReactDOM for overlays/UMD tools expecting globals
if (typeof window !== 'undefined' && import.meta && import.meta.env && import.meta.env.MODE !== 'production') {
  if (!('React' in window)) window.React = React;
  if (!('ReactDOM' in window)) window.ReactDOM = ReactDOM;
}

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
