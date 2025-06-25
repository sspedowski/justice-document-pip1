// Simple sanity checker – run:  npm run check
const fs = require("fs");
const required = [
  "server/server.js",
  "client/index.html",
  "client/script.js",
  ".env"
];
let ok = true;
for (const r of required) {
  if (fs.existsSync(r)) console.log("✅", r);
  else { console.error("❌ MISSING:", r); ok = false; }
}
if (!ok) process.exitCode = 1;