// Vitest / pure Node contexts don't need PostCSS; guard to avoid plugin load errors.
import tailwindcss from "@tailwindcss/postcss";

const disabled = !!process.env.VITEST;

export default disabled
  ? { plugins: [] }
  : { plugins: [tailwindcss()] };
