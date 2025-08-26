import js from "@eslint/js";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["dist/**", "node_modules/**", "build/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: { react, "react-hooks": hooks },
    rules: {
      ...js.configs.recommended.rules,
      // react plugin recommended rules
      ...(react && react.configs && react.configs.recommended ? react.configs.recommended.rules : {}),
      ...(hooks && hooks.configs && hooks.configs.recommended ? hooks.configs.recommended.rules : {})
    },
    settings: { react: { version: "detect" } }
  }
];
import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";

export default [
  // Equivalent to "eslint:recommended"
  js.configs.recommended,

  // Equivalent to "plugin:react/recommended"
  react.configs.recommended,

  // App source files
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    ignores: ["node_modules/", "dist/", "build/"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
        },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
      },
    },
    plugins: {
      react,
      "react-hooks": hooks,
      "jsx-a11y": a11y,
      import: importPlugin,
    },
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
      "import/order": ["warn", {
        groups: [["builtin", "external", "internal"], ["parent", "sibling", "index"]],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      }],
      "import/no-duplicates": "warn",
    },
  },

  // (Optional) Cypress tests
  {
    files: ["cypress/**/*.js", "cypress.config.*"],
    languageOptions: {
      // If your config is ESM, keep sourceType: "module"
      sourceType: "module",
      globals: { cy: "readonly", Cypress: "readonly" },
    },
    rules: {},
  },

  // (Optional) Project config files (eslint/vite/etc.)
  {
    files: ["eslint.config.js", "*.config.{js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { require: "readonly", module: "readonly", __dirname: "readonly" },
    },
    rules: {},
  },
];
