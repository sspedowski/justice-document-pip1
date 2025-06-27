document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("#generateBtn");
  const fileInput = document.querySelector("#fileInput");
  const results = document.querySelector("#results");

  btn.addEventListener("click", async () => {
    if (!fileInput.files.length) return alert("Please choose a file");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const res = await fetch("http://localhost:3000/api/summarize", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>Evidence</td>
      <td>Unknown</td>
      <td>Unspecified</td>
      <td>Summary: ${data.summary.slice(0, 20)}...</td>
      <td><a href="http://localhost:3000${data.fileURL}" target="_blank">View</a></td>
    `;
    results.appendChild(row);
  });
});
