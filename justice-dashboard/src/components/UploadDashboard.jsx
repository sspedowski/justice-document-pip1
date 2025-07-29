import React, { useState } from 'react';

export default function UploadDashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState([]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert('Please select a file first');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Use dynamic API URL for both local and production
      const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : window.location.origin;
      
      const res = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setSummary(data.summary || 'No summary available');
      setTags(data.tags || []);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading file');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow p-6 rounded-lg">
      <input
        type="file"
        onChange={handleFileChange}
        className="mb-4 border p-2 w-full"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Upload & Summarize
      </button>

      {summary && (
        <div className="mt-4">
          <h2 className="font-semibold">Summary:</h2>
          <p className="bg-gray-50 p-3 rounded border mt-2">{summary}</p>
        </div>
      )}

      {tags.length > 0 && (
        <div className="mt-4">
          <h2 className="font-semibold">Tags:</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, idx) => (
              <span key={idx} className="bg-green-200 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
