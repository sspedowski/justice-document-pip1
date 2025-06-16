window.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.querySelector("#generateBtn");
  const fileInput = document.querySelector("#fileInput");
  const table = document.querySelector("#results");

  if (!generateBtn || !fileInput || !table) {
    console.error("Required DOM elements not found.");
    return;
  }

  generateBtn.addEventListener("click", async () => {
    if (!fileInput.files.length) {
      alert("Please choose a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
      const res = await fetch("http://localhost:3000/api/summarize", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        alert("Failed to get summary.");
        return;
      }

      const data = await res.json();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>Evidence</td>
        <td>Unknown</td>
        <td>Unspecified</td>
        <td>Summary: ${data.summary.slice(0, 50)}...</td>
        <td><a href="http://localhost:3000${data.fileURL}" target="_blank">View</a></td>
      `;
      table.appendChild(row);
    } catch (error) {
      alert("An error occurred while processing the file.");
      console.error(error);
    }