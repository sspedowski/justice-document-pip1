import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';
// development-friendly object pretty-printer (no-op in production)
import '../../frontend/debug-tracer.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
