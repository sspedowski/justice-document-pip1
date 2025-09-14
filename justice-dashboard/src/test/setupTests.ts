/* eslint-env node */
import '@testing-library/jest-dom';
import { env as processEnv } from 'node:process';
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'node:util';
import { afterEach, vi } from 'vitest';

// Ensure predictable test env vars
processEnv.NODE_ENV = processEnv.NODE_ENV || 'test';
processEnv.JWT_SECRET = processEnv.JWT_SECRET || 'test-jwt-secret-for-testing-only';
processEnv.ADMIN_USERNAME = processEnv.ADMIN_USERNAME || 'admin';
processEnv.ADMIN_PASSWORD = processEnv.ADMIN_PASSWORD || 'adminpass';

// Quiet console noise, but keep errors
globalThis.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error,
};

// Test timeouts are controlled via vitest.config.ts (testTimeout)

// Polyfill TextEncoder/TextDecoder if missing (Node 18+ provides these in node:util)
if (!globalThis.TextEncoder && typeof NodeTextEncoder !== 'undefined') {
  // @ts-ignore - assign Node's TextEncoder to global
  globalThis.TextEncoder = NodeTextEncoder;
}
if (!globalThis.TextDecoder && typeof NodeTextDecoder !== 'undefined') {
  // @ts-ignore - assign Node's TextDecoder to global
  globalThis.TextDecoder = NodeTextDecoder;
}

// Clear mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

