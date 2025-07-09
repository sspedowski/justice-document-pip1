module.exports = {
  testEnvironment: "jsdom", // Use jsdom for DOM access (window, document)
  setupFilesAfterEnv: [], // Add setup files if needed
  roots: ["<rootDir>/frontend", "<rootDir>/backend", "<rootDir>/__tests__"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  moduleFileExtensions: ["js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "**/*.{js,jsx}",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/dist/**"
  ],
  coverageDirectory: "coverage",
  verbose: true,
  // Ensure DOM globals are available
  globals: {
    "window": {},
    "document": {}
  }
};
