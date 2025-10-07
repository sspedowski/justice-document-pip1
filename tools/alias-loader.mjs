// tools/alias-loader.mjs
// Custom ESM loader used by node:test to mirror Next.js alias behaviour
// and transpile TypeScript sources on the fly.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const rootPath = process.cwd();
const rootUrl = pathToFileURL(`${rootPath}/`);

export async function resolve(specifier, context, nextResolve) {
  // Map "@/lib/*" with priority: src/lib/* then lib/*
  if (specifier.startsWith('@/lib/')) {
    const rel = specifier.slice(6); // drop "@/lib/"
    const srcLibPath = resolvePath(rootPath, 'src/lib', rel);
    const libPath = resolvePath(rootPath, 'lib', rel);

    if (existsSync(srcLibPath)) {
      return { url: pathToFileURL(srcLibPath).href, shortCircuit: true };
    }
    if (existsSync(libPath)) {
      return { url: pathToFileURL(libPath).href, shortCircuit: true };
    }
  }

  // Map "@/app/*" -> "app/*"
  if (specifier.startsWith('@/app/')) {
    const rel = specifier.slice(6); // drop "@/app/"
    const target = new URL(`app/${rel}`, rootUrl).href;
    return { url: target, shortCircuit: true };
  }

  // Map "@/*" -> "src/*" (default)
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2); // drop "@/"
    const target = new URL(`src/${rel}`, rootUrl).href;
    return { url: target, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && (url.endsWith('.ts') || url.endsWith('.tsx'))) {
    const filePath = fileURLToPath(url);
    const source = await readFile(filePath, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      fileName: filePath,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        isolatedModules: true,
        verbatimModuleSyntax: true,
        sourceMap: false,
      },
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  }

  return nextLoad(url, context);
}
