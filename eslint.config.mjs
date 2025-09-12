import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      // Test files and directories
      "cypress/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/__tests__/**",
      "**/test/**",
      // Legacy and third-party code
      "legacy/**",
      "external/**",
      "public/**",
      "web/**",
      "pdfs/**",
      // Generated files
      "**/*.min.js",
      "**/*.map",
      // Backend CommonJS files that use require()
      "backend/**",
      "justice-server/**",
      "scripts/**",
      // Other project directories with their own configs
      "justice-dashboard/**",
      "justice-dashboard-v2/**",
      "justice-dashboard-firebase/**",
      // Frontend directory (has its own config)
      "frontend/**",
      // Temporary and debug files
      "tmp-run-eslint.js",
      "debug-tracer.js",
      "jest.setup.js",
    ],
  },
];

export default eslintConfig;
