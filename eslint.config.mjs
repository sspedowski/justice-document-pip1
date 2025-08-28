import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["legacy/**","dist/**","node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["frontend/**/*.{ts,tsx,js,jsx}","backend/**/*.{ts,js}"],
    languageOptions: { parserOptions: { ecmaVersion: "latest", sourceType: "module" } }
  }
];
