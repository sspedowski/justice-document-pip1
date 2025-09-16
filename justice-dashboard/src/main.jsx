// Boot diagnostics to surface startup errors in the console
// Remove once the white screen issue is resolved
/* eslint-disable no-console */
try {
  console.log('[BOOT] main.jsx starting');
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => console.error('[WINDOW.ERROR]', e.error || e.message));
    window.addEventListener('unhandledrejection', (e) => console.error('[UNHANDLED REJECTION]', e.reason));
  }
} catch {/* ignore */}
/* eslint-enable no-console */

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';

// Dev-only shim refinement: expose globals strictly in dev
if (import.meta.env && import.meta.env.DEV) {
  window.React = React;
  window.ReactDOM = ReactDOM;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
