// tools/alias-loader.mjs
// ESM loader for Node.js tests to resolve '@/' alias (used by Next.js via tsconfig paths)
import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { readFileSync } from 'node:fs';

const rootPath = process.cwd();
const rootUrl = pathToFileURL(rootPath + '/');

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
    const target = new URL('app/' + rel, rootUrl).href;
    return { url: target, shortCircuit: true };
  }

  // Map "@/*" -> "src/*" (default)
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2); // drop "@/"
    const target = new URL('src/' + rel, rootUrl).href;
    return { url: target, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  // Delegate transpilation to subsequent loaders (e.g., esbuild/tsx)
  // We only perform alias resolution in resolve(); for load(), we let the next loader handle it.
  return nextLoad(url, context);
}
