import React from 'react';
import { createRoot } from 'react-dom/client';
import StaffToolbar from './staff/StaffToolbar.jsx';

function App() {
  return (
    <div>
      <h1 className="sr-only">Justice Dashboard</h1>
      <StaffToolbar />
    </div>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(<App />);
