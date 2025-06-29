import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        crypto: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly'
      }
    },
    files: ['client/**/*.js'],
    rules: {
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-console': 'off'
    }
  },
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        // Node.js globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        console: 'readonly'
      }
    },
    files: ['server/**/*.js', '*.js'],
    ignores: ['client/**/*.js'],
    rules: {
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-console': 'off'
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'client/dist/**',
      'uploads/**',
      'server/uploads/**',
      'server/public/uploads/**'
    ]
  }
];
