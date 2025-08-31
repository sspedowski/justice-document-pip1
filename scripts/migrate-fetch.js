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
  // Deprecated: replaced by safer, compatibility-minded helpers below.
  // Keep for backward-compat but delegate to transform helpers.
  const regex = /(^|[^A-Za-z0-9_.$])fetch\s*\(/g;
  let m;
  const replacements = [];
  while ((m = regex.exec(content)) !== null) {
    const idx = m.index + (m[1] ? m[1].length : 0);
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

// CLI option to control where import is inserted (relative path used by default)
const importSpec = argv.import || './lib/authFetch';

function ensureImport(src, importSpecLocal = importSpec) {
  if (/import\s*\{\s*authFetch\s*\}\s*from\s*['"][^'"]+['"]/m.test(src)) return src;

  const IMPORT_LINE = `import { authFetch } from "${importSpecLocal}";`;
  const lines = src.split(/\r?\n/);
  let insertAt = 0;
  while (insertAt < lines.length && /^\s*(\/\/|\/\*|\*|#!)/.test(lines[insertAt])) insertAt++;
  lines.splice(insertAt, 0, IMPORT_LINE);
  return lines.join('\n');
}

function shouldSkipFileForNativeFetch(filePath, src) {
  const lower = filePath.toLowerCase();
  if (/(^|\/)sw(\.|-)?.*js$/.test(lower)) return true;
  if (/serviceworker\.m?js$/.test(lower)) return true;
  if (/worker\.m?js$/.test(lower)) return true;
  if (/auth[-_]fetch\.m?js$/.test(lower)) return true;
  if (/fetch[-_]?polyfill/i.test(lower)) return true;
  if (/\/node_modules\//.test(lower)) return true;
  if (/\bself\s*\.\s*addEventListener\s*\(\s*['"]fetch['"]/.test(src)) return true;
  return false;
}

function rewriteFetchCalls(src) {
  // Safe alternative that doesn't rely on lookbehind
  return src.replace(/(^|[^A-Za-z0-9_.$])fetch\s*\(/g, (m, p1) => `${p1}authFetch(`);
}

function findFetchLines(src) {
  const regex = /(^|[^A-Za-z0-9_.$])fetch\s*\(/g;
  const lines = [];
  let m;
  while ((m = regex.exec(src)) !== null) {
    const idx = m.index + (m[1] ? m[1].length : 0);
    const before = src.slice(0, idx);
    lines.push(before.split('\n').length);
  }
  return lines;
}

function transformFileSource(filePath, src, importSpecLocal = importSpec) {
  if (shouldSkipFileForNativeFetch(filePath, src)) return { changed: false, out: src, reason: 'skip-native-fetch-file' };
  if (!/\bfetch\s*\(/.test(src)) return { changed: false, out: src, reason: 'no-fetch' };
  if (/authFetch\s*\(/.test(src)) return { changed: false, out: src, reason: 'already-authfetch' };

  const out = rewriteFetchCalls(src);
  if (out === src) return { changed: false, out: src, reason: 'no-change' };

  const withImport = ensureImport(out, importSpecLocal);
  return { changed: withImport !== src, out: withImport, reason: 'rewritten' };
}

let totalMatches = 0;
const report = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const lines = findFetchLines(txt);
  if (lines.length === 0) continue;
  const { changed, out, reason } = transformFileSource(f, txt, importSpec);
  if (!changed) {
    // report but skip writing
    report.push({ file: f, count: lines.length, lines, reason });
    totalMatches += lines.length;
    continue;
  }
  totalMatches += lines.length;
  report.push({ file: f, count: lines.length, lines, reason });
  if (dry) continue;
  const bak = f + '.bak';
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, txt, 'utf8');
  fs.writeFileSync(f, out, 'utf8');
  console.log('WROTE:', f, 'bak->', bak);
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
  console.log('Matches:', r.count, 'Lines:', r.lines.join(', '), 'Reason:', r.reason || 'n/a');
}

console.log('Done.');
