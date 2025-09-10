module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  transform: { "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testTimeout: 30000
};
