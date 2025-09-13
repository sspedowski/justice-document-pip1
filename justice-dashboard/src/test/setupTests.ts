import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// Ensure predictable test env vars
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';
process.env.ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpass';

// Quiet console noise, but keep errors
// eslint-disable-next-line no-console
globalThis.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error,
};

// Test timeouts
vi.setTimeout(10000);

// Polyfill TextEncoder/TextDecoder if missing
try {
  // util exports are present on Node 18+
  // @ts-ignore - allow require in TS setup
  const u = require('util');
  if (!globalThis.TextEncoder && u.TextEncoder) globalThis.TextEncoder = u.TextEncoder;
  if (!globalThis.TextDecoder && u.TextDecoder) globalThis.TextDecoder = u.TextDecoder as any;
} catch {
  // ignore
}

// Clear mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

