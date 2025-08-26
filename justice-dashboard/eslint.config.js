const path = require('path');
let resolvedParser = null;
try {
  // prefer parser from frontend node_modules, fall back to repo root
  resolvedParser = require.resolve(path.join(__dirname, 'node_modules', '@babel', 'eslint-parser'));
} catch (e) {
  try {
    resolvedParser = require.resolve(path.join(__dirname, '..', 'node_modules', '@babel', 'eslint-parser'));
  } catch (e2) {
    // leave null — ESLint will fall back and may error if parser missing
    resolvedParser = null;
  }
}

module.exports = [
  {
    // Apply to all JS/JSX/TS/TSX files in the frontend package
    files: ["**/*.{js,jsx,ts,tsx}"],
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
    ],
    languageOptions: {
      parser: resolvedParser || '@babel/eslint-parser',
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2021,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        babelOptions: {
          presets: [
            ["@babel/preset-env", { targets: { node: 'current' } }],
            "@babel/preset-react"
          ]
        }
      }
    },
  plugins: { react: require('eslint-plugin-react') },
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
