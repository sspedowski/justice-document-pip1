#!/usr/bin/env node
// Cross-platform fetch -> authFetch migrator
// Usage: node migrate-fetch.js --root <path> [--dry] [--apply] [--exclude <comma-separated>]

const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node scripts/migrate-fetch.js --root <path> [--dry] [--apply] [--exclude <comma,separated>]');
  process.exit(1);
}

const argv = require('minimist')(process.argv.slice(2), { boolean: ['dry','apply'], string: ['root','exclude'] });
if (!argv.root) usage();
const root = path.resolve(argv.root);
const dry = !!argv.dry || !argv.apply;
const apply = !!argv.apply;
const exclude = (argv.exclude || '').split(',').map(s => s.trim()).filter(Boolean);

const exts = ['.js','.jsx','.ts','.tsx'];

function isExcluded(file) {
  const p = file.replace(/\\/g,'/');
  if (p.includes('/node_modules/')) return true;
  if (p.includes('/dist/') || p.includes('/build/')) return true;
  for (const e of exclude) if (p.includes(e)) return true;
  return false;
}

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results.push(...walk(full));
    } else {
      if (exts.includes(path.extname(full))) results.push(full);
    }
  });
  return results;
}

function previewReplacements(content) {
  // match fetch( not preceded by a word char (to avoid authFetch) or dot (obj.fetch)
  // Use a regex that finds fetch( with optional whitespace
  const regex = /(?<![A-Za-z0-9_\.$])fetch\s*\(/g;
  let m;
  const replacements = [];
  while ((m = regex.exec(content)) !== null) {
    const idx = m.index;
    // capture the line number
    const before = content.slice(0, idx);
    const line = before.split('\n').length;
    replacements.push({ index: idx, line });
  }
  return replacements;
}

if (!fs.existsSync(root)) {
  console.error('Root path not found:', root);
  process.exit(2);
}

const files = walk(root).filter(f => !isExcluded(f));
let totalMatches = 0;
const report = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  if (!txt.includes('fetch(') && !/\bfetch\s*\(/.test(txt)) continue;
  if (txt.includes('authFetch(')) continue; // skip files that already use authFetch
  const replacements = previewReplacements(txt);
  if (replacements.length === 0) continue;
  totalMatches += replacements.length;
  report.push({ file: f, count: replacements.length, lines: replacements.map(r=>r.line) });
}

if (report.length === 0) {
  console.log('No raw fetch() usages found in', root);
  process.exit(0);
}

console.log('Dry run:', dry ? 'YES' : 'NO', 'Apply:', apply ? 'YES' : 'NO');
console.log('Files to change:', report.length, 'Total fetch() matches:', totalMatches);
for (const r of report) {
  console.log('-'.repeat(60));
  console.log(r.file);
  console.log('Matches:', r.count, 'Lines:', r.lines.join(', '));
  if (dry) continue;
  // perform replacement and optionally backup
  const content = fs.readFileSync(r.file, 'utf8');
  const newContent = content.replace(/(?<![A-Za-z0-9_\.$])fetch\s*\(/g, 'authFetch(');
  const bak = r.file + '.bak';
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, content, 'utf8');
  fs.writeFileSync(r.file, newContent, 'utf8');
  console.log('WROTE:', r.file, 'bak->', bak);
}

console.log('Done.');
