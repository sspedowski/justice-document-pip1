#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';

const sh = (cmd) => execSync(cmd, { stdio: 'inherit' });

function once() {
  // use local next so PATH isn’t an issue
  sh('pnpm exec next build');
}

try {
  once();
} catch (e) {
  const msg = String(e?.message || e);
  const isExportDirErr =
    (msg.includes('ENOTEMPTY') || msg.includes('EPERM')) &&
    msg.includes('.next\\export');

  if (isExportDirErr && existsSync('.next/export')) {
    console.warn('[build-next-retry] Windows lock on .next/export; removing and retrying once…');
    rmSync('.next/export', { recursive: true, force: true });
    once();
  } else {
    throw e;
  }
}