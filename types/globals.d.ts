// Allow importing .mjs modules in TypeScript without enabling allowJs
declare module "*.mjs" {
  const mod: unknown;
  export default mod;
}
