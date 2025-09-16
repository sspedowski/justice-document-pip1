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
