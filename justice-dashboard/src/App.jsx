import React from 'react';
import UploadDashboard from './components/UploadDashboard.jsx'; // Explicit extension just in case

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Justice Dashboard</h1>
      <UploadDashboard />
    </div>
  );
}
