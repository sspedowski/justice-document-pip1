/** Route C: fast handler + unit tests (no Next server boot) */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/justice-dashboard/tests'],
  testMatch: ['**/?(*.)+(test|spec).[tj]s?(x)'],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/', // ignore heavy legacy integration suites
    '<rootDir>/tests/summarize-route.*.test.ts',
    '<rootDir>/justice-dashboard/tests/ui.test.js'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json', useESM: false }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: ['<rootDir>/.next', '<rootDir>/justice-dashboard/.next'],
  watchPathIgnorePatterns: ['<rootDir>/.next', '<rootDir>/node_modules'],
};


