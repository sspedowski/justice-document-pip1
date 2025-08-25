// Temp script to programmatically run ESLint in the frontend folder
(async () => {
  try {
    const path = require('path');
    const frontendDir = path.resolve(__dirname, 'justice-dashboard');
    const { ESLint } = require(path.join(frontendDir, 'node_modules', 'eslint'));
    const eslint = new ESLint({ cwd: frontendDir });
    const results = await eslint.lintFiles(['.']);
  const fs = require('fs');
  const out = [];
  out.push('RESULTS_COUNT ' + results.length);
  const formatter = await eslint.loadFormatter('stylish');
  const output = formatter.format(results);
  out.push(output || 'NO_ISSUES');
  fs.writeFileSync('tmp-eslint-output.txt', out.join('\n\n'), 'utf8');
  console.log('WROTE tmp-eslint-output.txt');
  } catch (e) {
    console.error('ERROR', e && e.stack ? e.stack : e);
    process.exit(2);
  }
})();
