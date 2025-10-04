// tools/alias-loader.mjs
// ESM loader for Node.js tests to resolve '@/' alias (used by Next.js via tsconfig paths)
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const rootUrl = pathToFileURL(process.cwd() + '/'); // repo root

export async function resolve(specifier, context, nextResolve) {
  // Map "@/foo/bar" -> "<repoRoot>/foo/bar"
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2); // drop "@/"
    const diskPathBase = path.join(process.cwd(), rel);
    let resolvedPath = diskPathBase;
    // If no extension supplied, attempt common extensions
    if (!path.extname(diskPathBase)) {
      const exts = ['.ts', '.tsx', '.mjs', '.js', '.cjs'];
      for (const ext of exts) {
        if (fs.existsSync(diskPathBase + ext)) {
          resolvedPath = diskPathBase + ext;
          break;
        }
      }
    }
    const target = pathToFileURL(resolvedPath).href;
    return { url: target, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
