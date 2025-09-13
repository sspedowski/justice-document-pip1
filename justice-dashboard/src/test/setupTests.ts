import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Ensure predictable test env vars without mutating process.env directly
beforeAll(() => {
  if (typeof vi.stubEnv === 'function') {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('JWT_SECRET', 'test-jwt-secret-for-testing-only');
    vi.stubEnv('ADMIN_USERNAME', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'adminpass');
  }
});
afterAll(() => {
  if (typeof vi.unstubAllEnvs === 'function') {
    vi.unstubAllEnvs();
  }
});

// Quiet console noise, but keep errors
globalThis.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error,
};

// Prefer default timers; individual tests can control timeouts or use fake timers if needed.

// Polyfill TextEncoder/TextDecoder if missing
(() => {
  try {
    // In Node-based environments, util provides TextEncoder/TextDecoder
    // Use dynamic import to avoid require in ESM contexts
    // @ts-ignore - allow dynamic import without top-level await in setup
    import('node:util').then((u) => {
      // @ts-ignore
      if (!globalThis.TextEncoder && u.TextEncoder) globalThis.TextEncoder = u.TextEncoder;
      // @ts-ignore
      if (!globalThis.TextDecoder && u.TextDecoder) globalThis.TextDecoder = u.TextDecoder;
    }).catch(() => {/* ignore */});
  } catch {
    // ignore
  }
})();

// Clear mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

