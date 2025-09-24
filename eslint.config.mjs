// ESLint flat config for the Next.js app at repo root
// Ref: https://eslint.org/docs/latest/use/getting-started#configuration
// Uses Next's official config and adds sensible ignores and env globals.

import next from "eslint-config-next";
import js from "@eslint/js";
import globals from "globals";

export default [
  // Next.js recommended rules (includes TypeScript + React setup)
  ...next,

  // Global ignores (flat config replaces .eslintignore)
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "build/**",
      "dist/**",
      "public/dashboard/assets/**",
      "justice-dashboard/dist/**",
      "frontend/dist/**",
      "cypress/videos/**",
      "cypress/screenshots/**",
      "**/*.d.ts",
    ],
  },

  // Default JS/TS files in the web app (browser globals)
  {
    files: ["**/*.{js,jsx,ts,tsx}", "app/**/*.ts", "app/**/*.tsx", "src/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // Node context: config and scripts
  {
    files: [
      "*.{js,cjs,mjs}",
      "scripts/**/*.{js,mjs}",
      "*.config.{js,cjs,mjs}",
      "**/vite.config.{ts,js}",
      "**/vitest.config.{ts,js}",
      "**/postcss.config.{ts,js,cjs,mjs}",
      "**/tailwind.config.{ts,js,cjs,mjs}",
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Test files (Vitest globals)
  {
    files: ["**/*.{test,spec}.{ts,tsx,js,jsx}", "cypress/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...(globals.vitest ?? {}),
      },
    },
  },
];
