/** CI-only config: enforce no-explicit-any on first-party TS only (classic ESLint format) */
module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'coverage/**',
    'tests/**',
    'tests-node/**',
    'cypress/**',
    'examples/**',
    'types/**',
    'vitest.config.ts',
    'justice-server/**',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  overrides: [
    {
      files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
