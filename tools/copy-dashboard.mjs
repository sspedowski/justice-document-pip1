// tools/copy-dashboard.mjs
// Copies the built dashboard bundle into public/dashboard so Next.js can serve it.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const cwd = process.cwd();
const envSrc = process.env.DASHBOARD_DIST?.trim();
const strict = (process.env.DASHBOARD_COPY_STRICT ?? 'true').toLowerCase() !== 'false';
const appDir = path.resolve(cwd, process.env.DASHBOARD_APP_DIR?.trim() || 'justice-dashboard');

const candidates = [
  envSrc,
  path.join(appDir, 'dist'),
  'packages/frontend/dist',
  'packages/dashboard/dist',
  'dashboard/dist',
  'dist',
  'apps/dashboard/dist'
]
  .filter(Boolean)
  .map((candidate) => path.resolve(cwd, candidate));

function directoryExists(dir) {
  try {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

const src = candidates.find(directoryExists);

if (!src) {
  const message =
    `copy-dashboard: no dashboard dist directory found.\n` +
    `Checked:\n${candidates.map((candidate) => ` - ${candidate}`).join('\n')}\n` +
    `Hint: set DASHBOARD_DIST to your dashboard build output (e.g. justice-dashboard/dist).`;
  if (strict) {
    console.error(message);
    process.exit(1);
  } else {
    console.warn(message);
    process.exit(0);
  }
}

const dst = path.resolve(cwd, 'public', 'dashboard');

async function rmrf(target) {
  if (!directoryExists(target) && !fs.existsSync(target)) return;
  await fsp.rm(target, { recursive: true, force: true });
}

await fsp.mkdir(dst, { recursive: true });
const existingEntries = await fsp.readdir(dst);
for (const entry of existingEntries) {
  await rmrf(path.join(dst, entry));
}
await fsp.cp(src, dst, { recursive: true });

console.log(`copy-dashboard: copied "${src}" -> "${dst}"`);
