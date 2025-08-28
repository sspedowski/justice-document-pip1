module.exports = {
  testEnvironment: 'node',
  // Focus tests on API/server behavior (exclude UI/JSX tests that require Babel)
  testMatch: ['**/tests/*api*.test.js'],
  collectCoverageFrom: [
    'justice-server/**/*.js',
    '!justice-server/node_modules/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true
};
