import js from "@eslint/js";
import ts from "typescript-eslint";

export default [
  { ignores: ["dist/**","legacy/**","**/*.min.js","**/vendor/**","frontend/public/**","frontend/uploads/**","**/tmp-*.js"] },
  js.configs.recommended, 
  ...ts.configs.recommended,
  { 
    rules: {
      "no-case-declarations":"off",
      "no-fallthrough":"off",
      "@typescript-eslint/no-unused-vars":["warn",{argsIgnorePattern:"^_",varsIgnorePattern:"^_",ignoreRestSiblings:true}],
      "@typescript-eslint/no-unused-expressions":["error",{allowShortCircuit:true,allowTernary:true,allowTaggedTemplates:true}]
    }
  },
  { 
    files:["frontend/**/*.{js,jsx,ts,tsx}"],
    languageOptions:{
      parserOptions:{ecmaVersion:"latest",sourceType:"module"},
      globals:{
        window:"readonly",document:"readonly",console:"readonly",setTimeout:"readonly",
        OffscreenCanvas:"readonly",ImageData:"readonly",Blob:"readonly",createImageBitmap:"readonly",
        CompressionStream:"readonly",ReadableStream:"readonly",atob:"readonly",URL:"readonly",crypto:"readonly"
      }
    }
  },
  { 
    files:["backend/**/*.{js,ts}","scripts/**/*.js"],
    languageOptions:{
      parserOptions:{ecmaVersion:"latest",sourceType:"module"},
      globals:{fetch:"readonly",Response:"readonly",setTimeout:"readonly"}
    },
    rules:{"@typescript-eslint/no-require-imports":"off"}
  },
  { 
    files:["**/*.cjs","**/*config.cjs"], 
    languageOptions:{sourceType:"commonjs"},
    rules:{"@typescript-eslint/no-require-imports":"off","no-undef":"off"}
  }
];
