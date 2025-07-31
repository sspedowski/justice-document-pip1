module.exports = {
  env: {
    browser: true,    // <-- add browser for React apps
    node: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended"   // <-- add React plugin
  ],
  plugins: ["react"],            // <-- add React plugin
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true                 // <-- enable JSX parsing
    }
  },
  settings: {
    react: {
      version: "detect"         // <-- auto-detect React version
    }
  },
  rules: {},
};