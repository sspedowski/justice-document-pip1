// tools/alias-loader.mjs
// ESM loader for Node.js tests to resolve '@/' alias (used by Next.js via tsconfig paths)
import { pathToFileURL } from 'node:url';

const rootUrl = pathToFileURL(process.cwd() + '/'); // repo root

export async function resolve(specifier, context, nextResolve) {
  // Map "@/foo/bar" -> "<repoRoot>/foo/bar"
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2); // drop "@/"
    const target = new URL(rel, rootUrl).href;
    return { url: target, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
