import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "dist");
const bad = /\bwindow\.(React|ReactDOM)\s*=/;

function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

const files = statSync(root, { throwIfNoEntry: false }) ? listFiles(root) : [];
let offending = [];

for (const f of files) {
  // Only scan text assets
  if (!/\.(js|html|css|map|txt|json)$/i.test(f)) continue;
  const txt = readFileSync(f, "utf8");
  if (bad.test(txt)) offending.push(f);
}

if (offending.length) {
  console.error("❌ Found production globals assigned:", offending);
  process.exit(1);
} else {
  console.log("✅ No React globals found in production bundle.");
}
