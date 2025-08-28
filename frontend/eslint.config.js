import globals from "globals";

export default [
  // Frontend / browser files
  {
    files: [
      "justice-dashboard/**/*.{js,jsx,ts,tsx}",
      "web/**/*.{js,jsx,ts,tsx}",
    ],
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "legacy/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Allow console in browser (can be tuned per env)
      "no-console": "off",
    },
  },

  // Server / Node files
  {
    files: [
      "justice-server/**/*.{js,mjs,cjs,ts}",
      "scripts/**/*.{js,mjs,cjs}",
      "tmp-run-eslint.js",
      "uploads-dir.js",
      "check-files.js",
      "admin-users.js",
      "**/*.config.{js,cjs,mjs}"
    ],
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "legacy/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
      parserOptions: { sourceType: "module" },
    },
    rules: {},
  },
];
