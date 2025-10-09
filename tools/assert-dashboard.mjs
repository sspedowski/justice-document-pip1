// tools/assert-dashboard.mjs
// Hard guard: ensures dashboard assets exist before Next.js build.
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const publicDashboard = path.resolve(cwd, 'public', 'dashboard');
const indexHtml = path.join(publicDashboard, 'index.html');
const assetsDir = path.join(publicDashboard, 'assets');

const checks = [
  { path: indexHtml, type: 'file', label: 'index.html' },
  { path: assetsDir, type: 'directory', label: 'assets/' },
];

let failed = false;

for (const { path: targetPath, type, label } of checks) {
  if (!existsSync(targetPath)) {
    console.error(`[assert-dashboard] MISSING: ${label} at ${targetPath}`);
    failed = true;
    continue;
  }

  const stat = statSync(targetPath);
  const isCorrectType =
    (type === 'file' && stat.isFile()) || (type === 'directory' && stat.isDirectory());

  if (!isCorrectType) {
    console.error(`[assert-dashboard] WRONG TYPE: ${label} expected ${type}, found at ${targetPath}`);
    failed = true;
    continue;
  }

  if (type === 'file' && stat.size === 0) {
    console.error(`[assert-dashboard] EMPTY: ${label} at ${targetPath}`);
    failed = true;
    continue;
  }

  console.log(`[assert-dashboard] ✓ ${label}`);
}

if (failed) {
  console.error(`\n[assert-dashboard] Dashboard artifacts missing or invalid.`);
  console.error(`Run: pnpm run build:dashboard:bundle && pnpm run build:dashboard:copy`);
  process.exit(1);
}

console.log('[assert-dashboard] All checks passed.');
