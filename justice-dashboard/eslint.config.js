import babelParser from "@babel/eslint-parser";
import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import a11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    ignores: ["node_modules/**", "dist/**", "build/**"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: { presets: ["@babel/preset-env", "@babel/preset-react"] },
      },
      globals: { window: "readonly", document: "readonly", navigator: "readonly" },
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
  // Cypress or test files (if present)
  {
    files: ["cypress/**/*.js", "cypress.config.*"],
    languageOptions: { sourceType: "module", globals: { cy: "readonly", Cypress: "readonly" } },
  },
];
