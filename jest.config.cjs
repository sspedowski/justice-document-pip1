/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Keep Jest out of Next's integration suites and focus on server/unit + the root middleware test
  roots: ['<rootDir>'],
  testMatch: [
    '<rootDir>/justice-dashboard/tests/**/?(*.)+(test|spec).[tj]s?(x)',
    '<rootDir>/tests/auth.middleware.test.ts',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/',
    '<rootDir>/tests/summarize-route.error.test.ts',
    '<rootDir>/tests/summarize-route.auth.test.ts',
    '<rootDir>/justice-dashboard/tests/ui.test.js',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json', useESM: false }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  watchPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};

