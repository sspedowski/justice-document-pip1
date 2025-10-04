/**
 * Feature flag helpers for the Vite app.
 *
 * Precedence:
 * - localStorage overrides everything when present ("1"/"true"/"on" -> enable, "0"/"false"/"off" -> disable)
 * - otherwise, environment flags enable when set to the string 'true'
 *   - Vite: import.meta.env.VITE_VERCEL_TOOLBAR_ENABLED
 *   - Next parity (when embedded): window.NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED
 */

/** Parse a boolean-ish string into boolean, or null if unknown */
export function parseBoolish(value) {
  if (value == null) return null;
  const v = String(value).trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'on' || v === 'yes') return true;
  if (v === '0' || v === 'false' || v === 'off' || v === 'no') return false;
  return null;
}

/** Try to read a boolean-ish key from localStorage. Returns boolean or null if not set/unrecognized. */
export function readLocalStorageFlag(key, win) {
  try {
    const w = win ?? (typeof window !== 'undefined' ? window : undefined);
    if (!w || !w.localStorage) return null;
    const raw = w.localStorage.getItem(key);
    return parseBoolish(raw);
  } catch {
    return null;
  }
}

/** Determine if the staff toolbar should be enabled. Accepts optional injected env and window for testability. */
export function staffToolbarEnabled({ env, win } = {}) {
  // 1) localStorage override takes precedence (supports two keys for convenience)
  const ls1 = readLocalStorageFlag('staffToolbar', win);
  const ls2 = readLocalStorageFlag('VERCEL_TOOLBAR', win);
  const ls = ls1 ?? ls2;
  if (ls !== null) return ls;

  // 2) Environment flags (Vite or Next-style)
  // Safely read Vite env without referencing the `import` keyword in typeof
  const viteEnv = env ?? (typeof import.meta !== 'undefined' && import.meta && import.meta.env ? import.meta.env : undefined);
  const viteEnabled = viteEnv && viteEnv.VITE_VERCEL_TOOLBAR_ENABLED === 'true';
  const nextEnabled = !!(win && win.NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED === 'true');
  return !!(viteEnabled || nextEnabled);
}

/** Returns a domain pattern string from env or window for optional domain guard. */
export function getToolbarDomainPattern({ env, win } = {}) {
  const viteEnv = env ?? (typeof import.meta !== 'undefined' && import.meta && import.meta.env ? import.meta.env : undefined);
  return (
    (viteEnv && viteEnv.VITE_VERCEL_TOOLBAR_DOMAIN_REGEX) ||
    (win && win.NEXT_PUBLIC_VERCEL_TOOLBAR_DOMAIN_REGEX) ||
    undefined
  );
}
