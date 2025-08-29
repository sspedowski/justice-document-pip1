export default [
  { ignores:["**/dist/**","**/*.min.*","legacy/**","web/**"] },
  { files:["frontend/**/*.{js,ts}"],
    languageOptions:{parserOptions:{ecmaVersion:"latest",sourceType:"module"},
      globals:{window:"readonly",document:"readonly",console:"readonly",setTimeout:"readonly",alert:"readonly"} } },
  { files:["backend/**/*.js"],
    languageOptions:{parserOptions:{ecmaVersion:"latest",sourceType:"commonjs"},
      globals:{require:"readonly",module:"readonly",__dirname:"readonly",process:"readonly",console:"readonly"} },
    rules:{"no-undef":"off"} }
];
