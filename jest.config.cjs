module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/justice-dashboard/tests'],
  testMatch: [
    '**/?(*.)+(test|spec).ts',
    '**/?(*.)+(test|spec).js'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json', useESM: false }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!file-type|strtok3|token-types|peek-readable)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/',
    '<rootDir>/archive/',
    '<rootDir>/tests/upload/upload.docid.test.ts',
    '<rootDir>/tests/summarize-route.*.test.ts',
    '<rootDir>/justice-dashboard/tests/ui.test.js'
  ],
  moduleFileExtensions: ['ts','tsx','js','jsx','json','node'],
  modulePathIgnorePatterns: [
  '<rootDir>/.next',
  '<rootDir>/**/.next',
  '<rootDir>/**/node_modules',
  '<rootDir>/archive'
  ],
  watchPathIgnorePatterns: [
  '<rootDir>/.next',
  '<rootDir>/archive'
  ]
};

