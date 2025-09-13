import path from 'node:path';
import fs from 'node:fs';
import { Project } from 'ts-morph';

const DRY = process.argv.includes('--dry');
const projectDir = process.cwd();
const srcDir = path.join(projectDir, 'src');
const exts = ['.ts', '.tsx', '.js', '.jsx'];

function resolveModule(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const tryPaths = [
    base,
    ...exts.map((e) => base + e),
    path.join(base, 'index'),
    ...exts.map((e) => path.join(base, 'index' + e)),
  ];
  for (const p of tryPaths) if (fs.existsSync(p)) return p;
  return null;
}

const project = new Project({ tsConfigFilePath: path.join(projectDir, 'tsconfig.json') });
project.addSourceFilesAtPaths(['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx']);

let changedCount = 0;
for (const sf of project.getSourceFiles()) {
  let fileChanged = false;
  for (const imp of sf.getImportDeclarations()) {
    const spec = imp.getModuleSpecifierValue();
    if (!spec.startsWith('../')) continue;
    if (/\.(css|less|sass|scss|svg|png|jpe?g|gif|json)$/i.test(spec)) continue;

    const resolved = resolveModule(sf.getFilePath(), spec);
    if (!resolved || !resolved.startsWith(srcDir)) continue;

    let withoutExt = resolved.replace(/\.[^.]+$/, '');
    let rel = path.posix
      .normalize(path.relative(srcDir, withoutExt))
      .replace(/\\/g, '/');
    if (rel.endsWith('/index')) rel = rel.slice(0, -'/index'.length);
    const alias = `@/${rel}`;

    if (alias !== spec) {
      if (DRY) {
        console.log(`${path.relative(projectDir, sf.getFilePath())}: ${spec} -> ${alias}`);
      } else {
        imp.setModuleSpecifier(alias);
        fileChanged = true;
        changedCount++;
      }
    }
  }
  if (fileChanged && !DRY) sf.saveSync();
}
if (!DRY) project.saveSync();
console.log(DRY ? 'Dry run complete.' : `Updated ${changedCount} import(s).`);

