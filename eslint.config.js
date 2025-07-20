export default [
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    ignores: [
      'pdf.min.js',
      'pdf.worker.min.js',
      'web/wasm/openjpeg_nowasm_fallback.js',
      'justice-dashboard/frontend/components/ErrorModal.jsx',
    ],
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // Add your custom rules here
    },
  },
];
