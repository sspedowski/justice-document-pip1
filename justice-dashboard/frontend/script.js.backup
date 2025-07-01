import { db } from '../firebase.js';

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("#generateBtn");
  const fileInput = document.querySelector("#fileInput");
  const results = document.querySelector("#results");

  btn.addEventListener("click", async () => {
    if (!fileInput.files.length) return alert("Please choose a file");

    const file = fileInput.files[0];
    
    try {
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        return alert("Please select a PDF file");
      }

      // Show processing message
      btn.textContent = "Processing...";
      btn.disabled = true;

      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to server
      const res = await fetch('http://localhost:3000/api/summarize', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      console.log('Server response:', data);

      // Add row to table with server data
      addRowToTable(data);
      
      // Clear file input
      fileInput.value = "";
      
      alert("File processed successfully!");
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert("Error processing file: " + error.message);
    } finally {
      // Reset button
      btn.textContent = "Generate Summary";
      btn.disabled = false;
    }
  });

  // Function to add row to table
  function addRowToTable(data) {
    const row = document.createElement("tr");
    row.className = "border-b";
    row.innerHTML = `
      <td class="p-2">${data.category}</td>
      <td class="p-2">${data.child}</td>
      <td class="p-2">
        <select class="text-xs border p-1">
          <option selected>${data.misconduct || 'Review Needed'}</option>
          <option>Physical Abuse</option>
          <option>Emotional Abuse</option>
          <option>Neglect</option>
          <option>Educational Neglect</option>
          <option>Medical Neglect</option>
          <option>Inappropriate Supervision</option>
          <option>Failure to Protect</option>
          <option>Substance Abuse</option>
          <option>Domestic Violence</option>
          <option>Other/Multiple</option>
        </select>
      </td>
      <td class="p-2 max-w-xs truncate" title="${data.summary}">${data.summary}</td>
      <td class="p-2">
        <button class="bg-blue-500 text-white px-2 py-1 text-xs rounded" onclick="window.open('${data.fileURL}', '_blank')">View</button>
      </td>
    `;
    results.appendChild(row);
  }
  
  // Add CSV export functionality
  const exportBtn = document.querySelector("button:last-of-type");
  if (exportBtn && exportBtn.textContent.includes("Export")) {
    exportBtn.addEventListener("click", () => {
      const rows = Array.from(results.querySelectorAll("tr"));
      if (rows.length === 0) {
        alert("No data to export");
        return;
      }
      
      const headers = ["Category", "Child", "Misconduct", "Summary", "Actions"];
      const csvData = [headers.join(",")];
      
      rows.forEach(row => {
        const cells = Array.from(row.cells).map(cell => {
          const select = cell.querySelector('select');
          if (select) return select.value;
          return cell.textContent.replace(/,/g, ";");
        });
        csvData.push(cells.join(","));
      });
      
      const blob = new Blob([csvData.join("\\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `justice_dashboard_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert("CSV exported successfully!");
    });
  }
});
