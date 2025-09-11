import fs from 'node:fs';

const HELP_PATHS = ['HELP.md', 'Help.md', 'docs/HELP.md'];
const helpPath = HELP_PATHS.find(p => fs.existsSync(p));
if (!helpPath) {
  console.error('No HELP.md found (looked in: ' + HELP_PATHS.join(', ') + ')');
  process.exit(0); // non-fatal
}
const src = fs.readFileSync(helpPath, 'utf8');
const lines = src.split('\n')
  .filter(l => /^#{1,3}\s+/.test(l))
  .map(l => l.replace(/^###\s+/, '    - ').replace(/^##\s+/, '  - ').replace(/^#\s+/, '- '));

const banner = `<!-- AUTO-GENERATED: do not edit by hand. Run \`npm run build:help:summary\` -->\n# Help Implementation Summary\n\n_Source:_ \`${helpPath}\`\n`;
const body = lines.join('\n') + `\n\n_Last updated: ${new Date().toISOString()}_\n`;
fs.writeFileSync('HELP_IMPLEMENTATION_SUMMARY.md', banner + '\n' + body, 'utf8');
console.log('Updated HELP_IMPLEMENTATION_SUMMARY.md from', helpPath);
