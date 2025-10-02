// CI-only ESLint config to enforce "no any" without fragile CLI JSON flags
module.exports = {
  extends: ['./.eslintrc.json'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
