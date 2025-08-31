import js from "@eslint/js";
import ts from "typescript-eslint";

export default [
  { ignores: [
      // Generated/build artifacts and vendor bundles
      "dist/**",
      "build/**",
      "web/**",
      "**/*.min.js",
      "**/vendor/**",
      // App-specific public/upload directories
      "frontend/public/**",
      "frontend/uploads/**",
      // Temporary files
      "**/tmp-*.js"
    ]
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    rules: {
      "no-case-declarations": "off",
      "no-fallthrough": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }
      ],
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true }
      ]
    }
  },
  {
    files: ["frontend/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: {
        window: "readonly", document: "readonly", console: "readonly", setTimeout: "readonly",
        OffscreenCanvas: "readonly", ImageData: "readonly", Blob: "readonly", createImageBitmap: "readonly",
        CompressionStream: "readonly", ReadableStream: "readonly", atob: "readonly", URL: "readonly", crypto: "readonly"
      }
    }
  },
  // Legacy plain browser scripts: declare common browser globals and authFetch as readonly
  {
    files: ["legacy/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        console: "readonly",
        alert: "readonly",
        FormData: "readonly",
        pdfjsLib: "readonly",
        authFetch: "readonly"
      }
    },
    rules: {
      "no-undef": "off"
    }
  },
  {
    files: ["backend/**/*.{js,ts}", "justice-server/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "commonjs" },
      globals: {
        console: "readonly", require: "readonly", module: "readonly", __dirname: "readonly", __filename: "readonly", process: "readonly",
        Buffer: "readonly", setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly", clearInterval: "readonly",
        fetch: "readonly", Response: "readonly"
      }
    },
    rules: { "@typescript-eslint/no-require-imports": "off", "no-undef": "off" }
  },
  {
    files: ["**/*.cjs", "**/*config.cjs"],
    languageOptions: { sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off", "no-undef": "off" }
  }
];

