module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': 'jest-transform-stub',
  },
  collectCoverageFrom: [
    'justice-server/**/*.js',
    'src/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
};
