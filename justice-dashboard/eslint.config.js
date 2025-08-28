import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import a11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}", "tests/**/*.js", "frontend/**/*.js"],
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.config.{js,cjs,mjs}",
      "vite.config.*",
      "jest.config.*",
      "postcss.config.*",
      "babel.config.*",
      "eslint.config.*",
      "cypress.config.*",
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: { react, "react-hooks": hooks, "jsx-a11y": a11y, import: importPlugin },
    settings: { react: { version: "detect" } },
    rules: {
      // Core
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // React + Hooks
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // A11y
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/no-autofocus": "warn",

      // Imports
      "import/order": [
        "warn",
        {
          groups: [["builtin", "external", "internal"], ["parent", "sibling", "index"]],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "warn",
    },
  },
  // Cypress e2e tests
  {
    files: ["cypress/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.browser, ...globals.mocha, cy: "readonly", Cypress: "readonly" },
    },
  },
  // Cypress config (Node)
  {
    files: ["cypress.config.*"],
    languageOptions: {
      sourceType: "script",
      globals: { ...globals.node },
    },
  },
];
