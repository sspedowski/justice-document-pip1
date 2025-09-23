#!/usr/bin/env node
import { existsSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const [,, srcArg = './dashboard', altArg = './justice-dashboard', destArg = './public/dashboard'] = process.argv;

const SRC = existsSync(srcArg) ? srcArg : (existsSync(altArg) ? altArg : null);
const DEST = destArg;

console.log(`[publish-dashboard.mjs] SRC=${SRC} DEST=${DEST}`);

if (!SRC) {
  console.log('[publish-dashboard.mjs] No Vite source found (skipping publish).');
  process.exit(0);
}

const cwd = resolve(process.cwd(), SRC);
let built = false;
try {
  const lockPath = join(cwd, 'package-lock.json');
  const shrinkPath = join(cwd, 'npm-shrinkwrap.json');
  const installCmd = (existsSync(lockPath) || existsSync(shrinkPath)) ? 'npm ci' : 'npm install';
  execSync(installCmd, { cwd, stdio: 'inherit', shell: true });
  execSync('npm run build', { cwd, stdio: 'inherit', shell: true });
  built = true;
} catch (e) {
  console.warn('[publish-dashboard.mjs] Build failed, will continue without updating assets:', e?.message || e);
}

try {
  rmSync(DEST, { recursive: true, force: true });
} catch {}
mkdirSync(DEST, { recursive: true });
if (existsSync(join(cwd, 'dist')) && existsSync(join(cwd, 'dist', 'index.html'))) {
  cpSync(join(cwd, 'dist'), DEST, { recursive: true });
  console.log(`[publish-dashboard.mjs] Published to ${DEST}`);
} else {
  console.warn('[publish-dashboard.mjs] No dist found to publish; serving fallback HTML at /dashboard');
}
