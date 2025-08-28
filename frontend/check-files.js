// Simple sanity checker: run `npm run check`
const fs = require("fs");
const path = require("path");

const required = [
  "server.js", // Root server entry (redirects to justice-server)
  "justice-server/server.js", // API server
  "justice-dashboard/index.html", // Vite app entry
  "justice-dashboard/src/App.jsx", // Frontend app
  "package.json", // Root package
];

console.log("Checking Justice Dashboard file structure...\n");

let ok = true;
for (const r of required) {
  const fullPath = path.join(__dirname, r);
  if (fs.existsSync(fullPath)) {
    console.log("OK:", r);
  } else {
    console.error("Missing:", r);
    ok = false;
  }
}

console.log("\n" + "=".repeat(50));
if (ok) {
  console.log("All critical files found!");
} else {
  console.log("Some files are missing - check the structure above.");
  process.exitCode = 1;
}
