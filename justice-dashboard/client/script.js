import { db } from './firebase.js';
import { collection, addDoc } from "firebase/firestore";

// Storage keys
const STORAGE_KEY = 'tracker';
const HASH_SET_KEY = 'hashSet';

// DOM elements
let fileInput, generateBtn, results, searchInput, childFilter;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM references
  fileInput = document.querySelector("#fileInput");
  generateBtn = document.querySelector("#generateBtn");
  results = document.querySelector("#results");
  searchInput = document.querySelector("#searchInput");
  childFilter = document.querySelector("#childFilter");
  
  // Add search and filter controls if they don't exist
  addSearchAndFilterControls();
  
  // Load existing data from localStorage
  loadTrackerData();
  
  // Event listeners
  generateBtn.addEventListener("click", handleFileUpload);
  
  // Search functionality
  if (searchInput) {
    searchInput.addEventListener("keyup", filterRows);
  }
  
  // Child filter functionality
  if (childFilter) {
    childFilter.addEventListener("change", filterRows);
  }
  
  // CSV export functionality
  const exportBtn = document.querySelector("button:last-of-type");
  if (exportBtn && exportBtn.textContent.includes("Export")) {
    exportBtn.addEventListener("click", exportToCSV);
  }
});

// Add search and filter controls to the UI
function addSearchAndFilterControls() {
  const dashboard = document.querySelector(".bg-white.p-6.rounded.shadow:last-child");
  if (!dashboard) return;
  
  // Check if controls already exist
  if (document.querySelector("#searchInput")) return;
  
  const controlsDiv = document.createElement("div");
  controlsDiv.className = "mb-4 flex gap-4 items-center";
  controlsDiv.innerHTML = `
    <div>
      <label for="searchInput" class="block text-sm font-medium mb-1">Search:</label>
      <input type="text" id="searchInput" placeholder="Search documents..." 
             class="border border-gray-300 rounded px-3 py-2 w-64">
    </div>
    <div>
      <label for="childFilter" class="block text-sm font-medium mb-1">Filter by Child:</label>
      <select id="childFilter" class="border border-gray-300 rounded px-3 py-2">
        <option value="">All</option>
        <option value="Jace">Jace</option>
        <option value="Josh">Josh</option>
        <option value="Both">Both</option>
        <option value="Unknown">Unknown</option>
      </select>
    </div>
  `;
  
  const table = dashboard.querySelector("table");
  dashboard.insertBefore(controlsDiv, table);
  
  // Update references
  searchInput = document.querySelector("#searchInput");
  childFilter = document.querySelector("#childFilter");
}

// Handle multi-file upload
async function handleFileUpload() {
  if (!fileInput.files.length) {
    alert("Please choose at least one file");
    return;
  }

  const files = Array.from(fileInput.files);
  
  // Show processing state
  generateBtn.textContent = "Processing...";
  generateBtn.disabled = true;
  
  try {
    for (const file of files) {
      await processFile(file);
    }
    
    // Clear file input
    fileInput.value = "";
    alert(`Successfully processed ${files.length} file(s)!`);
    
  } catch (error) {
    console.error('Error processing files:', error);
    alert("Error processing files: " + error.message);
  } finally {
    // Reset button
    generateBtn.textContent = "Generate Summary";
    generateBtn.disabled = false;
  }
}

// Process individual file with duplicate detection
async function processFile(file) {
  try {
    // Check file type
    if (file.type !== 'application/pdf') {
      console.warn(`Skipping non-PDF file: ${file.name}`);
      return;
    }

    // Compute file hash for duplicate detection
    const hash = await computeFileHash(file);
    const hashSet = getHashSet();
    
    if (hashSet.has(hash)) {
      console.log(`Duplicate detected, skipping: ${file.name}`);
      addRowToTable({
        fileName: file.name,
        category: 'Duplicate',
        child: 'N/A',
        misconduct: 'Duplicate File',
        summary: 'This file was previously uploaded',
        duplicate: true,
        hash: hash
      });
      return;
    }

    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);

    // TODO: Replace with actual server endpoint when ready
    // For now, simulate server response
    const mockResponse = await simulateServerResponse(file);
    
    // Add hash to set
    hashSet.add(hash);
    saveHashSet(hashSet);
    
    // Add to tracker
    const rowData = {
      ...mockResponse,
      duplicate: false,
      hash: hash,
      timestamp: new Date().toISOString()
    };
    
    addRowToTable(rowData);
    saveToTracker(rowData);
    
    // TODO: Save to Firestore when ready
    await saveToFirestore(rowData);
    
  } catch (error) {
    console.error(`Error processing file ${file.name}:`, error);
  }
}

// Compute SHA-256 hash of file for duplicate detection
async function computeFileHash(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get hash set from localStorage
function getHashSet() {
  const stored = localStorage.getItem(HASH_SET_KEY);
  return stored ? new Set(JSON.parse(stored)) : new Set();
}

// Save hash set to localStorage
function saveHashSet(hashSet) {
  localStorage.setItem(HASH_SET_KEY, JSON.stringify([...hashSet]));
}

// Simulate server response (TODO: replace with actual server call)
async function simulateServerResponse(file) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const fileName = file.name.toLowerCase();
  
  // Smart categorization
  let category = 'General';
  if (/medical|health|doctor|hospital|therapy|psychiatric/.test(fileName)) {
    category = 'Medical';
  } else if (/school|education|iep|grades|teacher/.test(fileName)) {
    category = 'School';
  } else if (/court|legal|police|case|judge|attorney/.test(fileName)) {
    category = 'Legal';
  }
  
  // Child detection
  let child = 'Unknown';
  const hasJace = /jace/i.test(fileName);
  const hasJosh = /josh/i.test(fileName);
  if (hasJace && hasJosh) child = 'Both';
  else if (hasJace) child = 'Jace';
  else if (hasJosh) child = 'Josh';
  
  // Misconduct detection
  let misconduct = 'Review Needed';
  if (/abuse/i.test(fileName)) misconduct = 'Physical Abuse';
  else if (/neglect/i.test(fileName)) misconduct = 'Neglect';
  else if (/educational/i.test(fileName)) misconduct = 'Educational Neglect';
  
  return {
    fileName: file.name,
    category,
    child,
    misconduct,
    summary: `Document: ${file.name}. Automated categorization complete.`,
    fileURL: '#' // TODO: actual file URL when server is ready
  };
}

// Add row to table
function addRowToTable(data) {
  const row = document.createElement("tr");
  row.className = "border-b";
  row.dataset.category = data.category;
  row.dataset.child = data.child;
  row.dataset.fileName = data.fileName;
  
  if (data.duplicate) {
    row.classList.add("bg-yellow-50", "text-gray-600");
  }
  
  row.innerHTML = `
    <td class="p-2">${data.category}</td>
    <td class="p-2">${data.child}</td>
    <td class="p-2">
      <select class="text-xs border p-1 ${data.duplicate ? 'bg-gray-100' : ''}" ${data.duplicate ? 'disabled' : ''}>
        <option selected>${data.misconduct}</option>
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
      <button class="bg-blue-500 text-white px-2 py-1 text-xs rounded ${data.duplicate ? 'opacity-50' : ''}" 
              ${data.duplicate ? 'disabled' : ''} 
              onclick="window.open('${data.fileURL}', '_blank')">View</button>
      ${data.duplicate ? '<span class="ml-2 text-xs text-yellow-600">Duplicate</span>' : ''}
    </td>
  `;
  
  results.appendChild(row);
}

// Filter rows based on search and child filter
function filterRows() {
  const searchTerm = searchInput?.value.toLowerCase() || '';
  const childValue = childFilter?.value || '';
  
  const rows = results.querySelectorAll("tr");
  
  rows.forEach(row => {
    const fileName = row.dataset.fileName?.toLowerCase() || '';
    const child = row.dataset.child || '';
    const category = row.dataset.category?.toLowerCase() || '';
    const summary = row.querySelector('td:nth-child(4)')?.textContent.toLowerCase() || '';
    
    const matchesSearch = !searchTerm || 
      fileName.includes(searchTerm) || 
      category.includes(searchTerm) ||
      summary.includes(searchTerm);
    
    const matchesChild = !childValue || child === childValue;
    
    row.style.display = (matchesSearch && matchesChild) ? '' : 'none';
  });
}

// Load tracker data from localStorage
function loadTrackerData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    data.forEach(item => addRowToTable(item));
  }
}

// Save to tracker (localStorage)
function saveToTracker(data) {
  const stored = localStorage.getItem(STORAGE_KEY);
  const tracker = stored ? JSON.parse(stored) : [];
  tracker.push(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
}

// Save to Firestore (TODO: implement when ready)
async function saveToFirestore(data) {
  try {
    if (!db) {
      console.log('Firestore not configured, skipping save');
      return;
    }
    
    const docRef = await addDoc(collection(db, "documents"), {
      ...data,
      createdAt: new Date()
    });
    
    console.log("Document written with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding document to Firestore: ", error);
  }
}

// Export to CSV with new columns
function exportToCSV() {
  const rows = Array.from(results.querySelectorAll("tr"));
  if (rows.length === 0) {
    alert("No data to export");
    return;
  }
  
  const headers = ["Category", "Child", "Misconduct", "Summary", "Duplicate", "File Name", "Timestamp"];
  const csvData = [headers.join(",")];
  
  // Get data from localStorage for complete info
  const stored = localStorage.getItem(STORAGE_KEY);
  const tracker = stored ? JSON.parse(stored) : [];
  
  tracker.forEach(item => {
    const row = [
      item.category || '',
      item.child || '',
      item.misconduct || '',
      `"${(item.summary || '').replace(/"/g, '""')}"`, // Escape quotes
      item.duplicate ? 'Yes' : 'No',
      `"${(item.fileName || '').replace(/"/g, '""')}"`,
      item.timestamp || ''
    ];
    csvData.push(row.join(","));
  });
  
  const blob = new Blob([csvData.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `justice_dashboard_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  alert("CSV exported successfully!");
}
