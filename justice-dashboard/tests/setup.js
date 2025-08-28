// Jest test setup file

// Extend Jest with DOM matchers
require('@testing-library/jest-dom');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'adminpass';

// Mock console.log to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep errors visible
};

// Global test timeout
jest.setTimeout(10000);

// Polyfill TextEncoder/TextDecoder for libraries that expect them in Node
try {
  const { TextEncoder, TextDecoder } = require('util');
  if (!global.TextEncoder) global.TextEncoder = TextEncoder;
  if (!global.TextDecoder) global.TextDecoder = TextDecoder;
} catch (_e) {
  // ignore polyfill errors in environments that already provide them
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

