// Vitest / pure Node contexts don't need PostCSS; guard to avoid plugin load errors.
const disabled = process.env.VITEST;
const config = disabled
  ? { plugins: [] }
  : { plugins: ["@tailwindcss/postcss"] };

export default config;
