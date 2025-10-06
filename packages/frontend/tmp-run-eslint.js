// Temp script to programmatically run ESLint in the frontend folder
(async () => {
  try {
    const path = require('path');
    const fs = require('fs');
    const frontendDir = path.resolve(__dirname, 'justice-dashboard');
    const { ESLint } = require(path.join(frontendDir, 'node_modules', 'eslint'));
    const wantFix = process.argv.includes('--fix');
    const eslint = new ESLint({ cwd: frontendDir, fix: wantFix });
    // Limit to app code and tests; skip config files
    const results = await eslint.lintFiles([
      'src/**/*.{js,jsx,ts,tsx}',
      'tests/**/*.js',
      'cypress/**/*.js',
    ]);
    if (wantFix) {
      await ESLint.outputFixes(results);
    }
    const out = [];
    out.push('RESULTS_COUNT ' + results.length);
    const formatter = await eslint.loadFormatter('stylish');
    const output = formatter.format(results);
    out.push(output || 'NO_ISSUES');
    const text = out.join('\n\n');
    fs.writeFileSync('tmp-eslint-output.txt', text, 'utf8');
    // Also print to stdout so you don't need to open the file
    console.log(text);
    console.log('\nWROTE tmp-eslint-output.txt');
  } catch (e) {
    console.error('ERROR', e && e.stack ? e.stack : e);
    process.exit(2);
  }
})();
