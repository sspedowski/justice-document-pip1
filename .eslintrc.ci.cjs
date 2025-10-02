/** CI-only config: enforce no-explicit-any on first-party TS only */
module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/**',
    'cypress/**',
    'tests/**',
    'tests-node/**',
    'examples/**',
    'dist/**',
    '.next/**',
  ],
  overrides: [
    {
      files: [
        'app/**/*.ts',
        'app/**/*.tsx',
        'src/**/*.ts',
        'src/**/*.tsx',
        'lib/**/*.ts',
        'lib/**/*.tsx',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint', 'react-hooks'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],
};
