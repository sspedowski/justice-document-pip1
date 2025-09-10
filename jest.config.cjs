/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/__tests__', '<rootDir>/justice-dashboard/tests'],
  testMatch: ['**/?(*.)+(test|spec).[tj]s?(x)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json', useESM: false }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: ['<rootDir>/**/.next', '<rootDir>/**/node_modules'],
  watchPathIgnorePatterns: ['<rootDir>/.next', '<rootDir>/**/.next', '<rootDir>/node_modules'],
};

