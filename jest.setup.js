// Polyfill TextEncoder/TextDecoder for older Node versions used in tests
if (typeof global.TextEncoder === 'undefined') {
  try {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  } catch (e) {
    // If util doesn't provide them, skip — some environments already have globals
  }
}

// Register DOM matchers for testing-library
try {
  require('@testing-library/jest-dom/extend-expect');
} catch (e) {
  // If the package isn't installed yet, tests will fail later; keep this file safe to require
}
