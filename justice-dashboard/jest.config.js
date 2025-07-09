module.exports = {
  testEnvironment: "jsdom", // Changed to jsdom for frontend tests
  roots: ["<rootDir>/frontend", "<rootDir>/backend", "<rootDir>/__tests__"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  moduleFileExtensions: ["js", "json", "node"],
  collectCoverageFrom: [
    "**/*.{js,jsx}",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/dist/**"
  ],
  coverageDirectory: "coverage",
  verbose: true
};
