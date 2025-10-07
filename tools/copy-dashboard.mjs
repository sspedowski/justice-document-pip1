// tools/copy-dashboard.mjs
// Copies the built dashboard bundle into public/dashboard so Next.js can serve it.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const cwd = process.cwd();
const envSrc = process.env.DASHBOARD_DIST?.trim();
const strict = (process.env.DASHBOARD_COPY_STRICT ?? 'true').toLowerCase() !== 'false';

const candidates = [
  envSrc,
  'packages/frontend/dist',
  'packages/dashboard/dist',
  'dashboard/dist',
  'apps/dashboard/dist',
]
  .filter(Boolean)
  .map((candidate) => path.resolve(cwd, candidate));

const src = candidates.find((candidate) => {
  try {
    return fs.existsSync(candidate) && fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
});

if (!src) {
  const message =
    `copy-dashboard: no dashboard dist directory found.\n` +
    `Checked:\n${candidates.map((candidate) => ` - ${candidate}`).join('\n')}\n` +
    `Hint: set DASHBOARD_DIST to your dashboard build output (e.g. packages/frontend/dist).`;
  if (strict) {
    console.error(message);
    process.exit(1);
  } else {
    console.warn(message);
    process.exit(0);
  }
}

const dst = path.resolve(cwd, 'public', 'dashboard');

await fsp.rm(dst, { recursive: true, force: true });
await fsp.mkdir(dst, { recursive: true });
await fsp.cp(src, dst, { recursive: true });

console.log(`copy-dashboard: copied "${src}" -> "${dst}"`);
