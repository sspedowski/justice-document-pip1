module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/?(*.)+(test|spec).[tj]s?(x)"],
  transform: { "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json", useESM: false }] },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  modulePathIgnorePatterns: [
    "<rootDir>/justice-dashboard-next/node_modules",
    "<rootDir>/justice-dashboard-next/.next",
    "<rootDir>/justice-dashboard-next/out"
  ],
  watchPathIgnorePatterns: [
    "<rootDir>/justice-dashboard-next/.next",
    "<rootDir>/node_modules"
  ],
  testTimeout: 30000,
  maxWorkers: 1
};
