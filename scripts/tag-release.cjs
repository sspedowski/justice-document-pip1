#!/usr/bin/env node
/**
 * tag-release.cjs
 * Creates an annotated git tag using package.json version and short commit SHA.
 * Usage: npm run release:tag
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(cmd) {
  return execSync(cmd, { stdio: 'pipe' }).toString().trim();
}

function main() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const version = pkg.version;
  if (!version) {
    console.error('No version field in package.json');
    process.exit(1);
  }
  const sha = run('git rev-parse --short=7 HEAD');
  const tag = `v${version}`;

  // Prevent overwriting existing tag
  const existingTags = run('git tag --list');
  if (existingTags.split(/\n/).includes(tag)) {
    console.error(`Tag ${tag} already exists. Bump version first.`);
    process.exit(1);
  }

  const message = `Release ${tag} (${sha})`;
  run(`git tag -a ${tag} -m "${message}"`);
  console.log(`Created tag ${tag}`);
  console.log('Push with: git push origin --tags');
}

main();
