const fs = require('fs');

const requiredFiles = [
  'backend/server.js',
  'frontend/index.html',
  'frontend/script.js'
];

let allPresent = true;

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing: ${file}`);
    allPresent = false;
  }
});

if (allPresent) {
  console.log('✅ All required files present.');
  process.exit(0);
} else {
  console.log('❗ Deployment check failed. Please ensure all files are in place.');
  process.exit(1);
}
