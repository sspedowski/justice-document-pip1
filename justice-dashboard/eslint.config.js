module.exports = [
  {
    // Apply to all JS/JSX/TS/TSX files in the frontend package
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    ignores: [
      "dist/**",
      "node_modules/**",
      "pdf.min.js",
      "pdf.worker.min.js",
      "web/wasm/openjpeg_nowasm_fallback.js",
      "justice-dashboard/frontend/components/ErrorModal.jsx",
    ],
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // Add your custom rules here
    },
  },
];
