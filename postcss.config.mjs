// Tailwind v4 PostCSS plugin for Next.js
// Ref: https://nextjs.org/docs/app/building-your-application/styling/tailwind-css
// and Tailwind v4 docs: use the named plugin in PostCSS config

const disabled = !!process.env.VITEST;

export default disabled
  ? { plugins: {} }
  : {
      plugins: {
        "@tailwindcss/postcss": {},
      },
    };
