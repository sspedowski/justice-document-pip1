// jest.config.cjs - fast handler + unit tests (no Next server spin)
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/justice-dashboard/tests'],
  testMatch: [
    '**/?(*.)+(test|spec).ts',
    '**/?(*.)+(test|spec).js'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json', useESM: false }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!file-type|strtok3|token-types|peek-readable)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/',
    '<rootDir>/tests/upload/upload.docid.test.ts',
    '<rootDir>/tests/summarize-route.*.test.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Rely on default node_modules ignore; .next not in roots so safe
};


