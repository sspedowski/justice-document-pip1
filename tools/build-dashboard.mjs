// tools/build-dashboard.mjs
// Optional dashboard bundle build helper. It runs a dashboard build command
// (default: pnpm --dir justice-dashboard build) and verifies the bundle exists.
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const buildCommand = process.env.DASHBOARD_BUILD_COMMAND;
const envSrc = process.env.DASHBOARD_DIST?.trim();
const verbose = (process.env.DASHBOARD_BUILD_VERBOSE ?? 'false').toLowerCase() === 'true';
const appDir = path.resolve(
  cwd,
  process.env.DASHBOARD_APP_DIR?.trim() || 'justice-dashboard'
);

function runDefaultBuild() {
  const buildArgs = ['--dir', appDir, 'build'];
  console.log(`build-dashboard: running "pnpm ${buildArgs.join(' ')}"`);
  const result = spawnSync('pnpm', buildArgs, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const candidates = [
  envSrc,
  path.join(appDir, 'dist'),
  'packages/frontend/dist',
  'packages/dashboard/dist',
  'dashboard/dist',
  'dist',
  'apps/dashboard/dist',
]
  .filter(Boolean)
  .map((candidate) => path.resolve(cwd, candidate));

try {
  if (buildCommand) {
    console.log(`build-dashboard: running custom command "${buildCommand}"`);
    execSync(buildCommand, { stdio: 'inherit', cwd, shell: true });
  } else {
    runDefaultBuild();
  }
} catch (error) {
  console.error('build-dashboard: build command failed.');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
}

const src = candidates.find((candidate) => {
  try {
    return fs.existsSync(candidate) && fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
});

if (!src) {
  const message =
    `build-dashboard: no dashboard dist directory found.\n` +
    `Checked:\n${candidates.map((candidate) => ` - ${candidate}`).join('\n')}\n` +
    `Set DASHBOARD_BUILD_COMMAND to run your dashboard build (e.g. "pnpm --dir justice-dashboard build") or ` +
    `commit the bundle and point DASHBOARD_DIST at it.`;
  console.error(message);
  process.exit(1);
}

if (verbose) {
  console.log(`build-dashboard: found dist at "${src}"`);
}
