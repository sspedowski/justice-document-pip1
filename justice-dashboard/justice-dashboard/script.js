document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("#generateBtn");
  const fileInput = document.querySelector("#fileInput");
  const results = document.querySelector("#results");

  btn.addEventListener("click", async () => {
    if (!fileInput.files.length) return alert("Please choose a file");

    const file = fileInput.files[0];
    
    try {
      // For now, create a mock summary since we don't have a server
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      
      // Simple category detection based on filename
      let category = "General";
      if (/medical|health|doctor|hospital/i.test(fileName)) category = "Medical";
      if (/school|education|grades/i.test(fileName)) category = "School";  
      if (/court|legal|police|case/i.test(fileName)) category = "Legal";
      
      // Simple child detection based on filename
      let child = "Unknown";
      if (/jace/i.test(fileName)) child = "Jace";
      if (/josh/i.test(fileName)) child = "Josh";
      if (/jace/i.test(fileName) && /josh/i.test(fileName)) child = "Both";
      
      // Create summary
      const summary = `${fileName} (${(fileSize/1024).toFixed(1)}KB, ${fileType || 'unknown type'})`;
      
      // Add row to table
      const row = document.createElement("tr");
      row.className = "border-b";
      row.innerHTML = `
        <td class="p-2">${category}</td>
        <td class="p-2">${child}</td>
        <td class="p-2">
          <select class="text-xs border p-1">
            <option>Review Needed</option>
            <option>HIPAA Violation</option>
            <option>Due Process Violation</option>
            <option>Educational Rights</option>
            <option>CPS Misconduct</option>
          </select>
        </td>
        <td class="p-2 max-w-xs truncate" title="${summary}">${summary}</td>
        <td class="p-2">
          <button class="bg-blue-500 text-white px-2 py-1 text-xs rounded" onclick="alert('File: ${fileName}')">View</button>
        </td>
      `;
      results.appendChild(row);
      
      // Clear file input
      fileInput.value = "";
      
      alert("File processed successfully!");
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert("Error processing file: " + error.message);
    }
  });
  
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
