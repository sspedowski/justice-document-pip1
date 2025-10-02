import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const VALIDATOR = join(ROOT, 'scripts', 'validate-secrets.mjs');

function runValidator(env = {}) {
  return new Promise((resolve) => {
    const cp = spawn(process.execPath, [VALIDATOR], {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    cp.stdout.on('data', (d) => (out += d));
    cp.stderr.on('data', (d) => (err += d));
    cp.on('close', (code) => resolve({ code, out, err }));
  });
}

test('dev: allows placeholder secrets (warn only)', async () => {
  const { code, out, err } = await runValidator({
    NODE_ENV: 'development',
    JWT_SECRET: 'dev-jwt-secret-change-me',
    SESSION_SECRET: 'dev-session-secret-change-me',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'adminpass',
  });
  assert.equal(code, 0);
  assert.match(out + err, /validate-secrets/i);
});

test('prod: fails when JWT_SECRET missing', async () => {
  const { code, err } = await runValidator({
    NODE_ENV: 'production',
    SESSION_SECRET: 'x'.repeat(32),
    ADMIN_USERNAME: 'secure-user',
    ADMIN_PASSWORD: 'this-is-a-secure-pass-123',
  });
  assert.notEqual(code, 0);
  assert.match(err, /JWT_SECRET/i);
});

test('prod: fails when SESSION_SECRET missing', async () => {
  const { code, err } = await runValidator({
    NODE_ENV: 'production',
    JWT_SECRET: 'x'.repeat(48),
    ADMIN_USERNAME: 'secure-user',
    ADMIN_PASSWORD: 'this-is-a-secure-pass-123',
  });
  assert.notEqual(code, 0);
  assert.match(err, /SESSION_SECRET/i);
});

test('prod: fails on weak/placeholder secrets', async () => {
  const { code, err } = await runValidator({
    NODE_ENV: 'production',
    JWT_SECRET: 'dev-jwt-secret-change-me',
    SESSION_SECRET: 'dev-session-secret-change-me',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'adminpass',
  });
  assert.notEqual(code, 0);
  assert.match(err, /placeholder|banned|admin/i);
});

test('prod: passes with strong secrets and non-default admin', async () => {
  const { code, out } = await runValidator({
    NODE_ENV: 'production',
    JWT_SECRET: 'A'.repeat(40),
    SESSION_SECRET: 'B'.repeat(40),
    ADMIN_USERNAME: 'ops-user',
    ADMIN_PASSWORD: 'C'.repeat(16),
  });
  assert.equal(code, 0);
  assert.match(out, /OK/i);
});
