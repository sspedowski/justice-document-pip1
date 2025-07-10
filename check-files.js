// Simple sanity checker – run: npm run check
const fs = require("fs");
const path = require("path");

const required = [
  "server.js",                    // Root level server
  "index.html",                   // Root level index 
  "script.js",                    // Root level script
  "package.json",                 // Package config
  ".env"                          // Environment variables
];

console.log("🔍 Checking Justice Dashboard file structure...\n");

let ok = true;
for (const r of required) {
  const fullPath = path.join(__dirname, r);
  if (fs.existsSync(fullPath)) {
    console.log("✅", r);
  } else { 
    console.error("❌ MISSING:", r); 
    ok = false; 
  }
}

console.log("\n" + "=".repeat(50));
if (ok) {
  console.log("🎉 All critical files found!");
} else {
  console.log("⚠️  Some files are missing - check the structure above.");
  process.exitCode = 1;
}