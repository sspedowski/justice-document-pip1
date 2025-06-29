const fs = require('fs');
const path = require('path');

// File paths to check
const FILES_TO_CHECK = [
  "server/server.js",
  "client/script.js",
  "client/index.html",
  "client/styles.css",
  "client/firebase.js",
  "package.json",
  "vite.config.js",
  ".eslintrc.json"
];

console.log('🔍 Checking file structure...\n');

let allExist = true;

FILES_TO_CHECK.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`❌ ${filePath} - NOT FOUND`);
    allExist = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allExist) {
  console.log('🎉 All files exist! Structure looks good.');
  process.exit(0);
} else {
  console.log('⚠️  Some files are missing. Check the structure.');
  process.exit(1);
}
