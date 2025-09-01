// Local, self-contained authFetch for the React app.
// No imports outside the app root (Vite-safe).

let __csrfCache = null;
function readCookie(name) {
  try {
    // Escape special regex chars in the cookie name (no need to escape '/')
    const pattern = new RegExp('(?:^|;\\s*)' + name.replace(/[-.\\^$*+?()[\]{}|]/g, '\\$&') + '=([^;]+)');
    const m = typeof document !== 'undefined' && document.cookie ? document.cookie.match(pattern) : null;
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

async function ensureCsrfToken() {
  if (__csrfCache) return __csrfCache;
  const fromCookie = readCookie('_csrf') || readCookie('csrfToken');
  if (fromCookie) return (__csrfCache = fromCookie);
  try {
    const r = await fetch('/api/csrf-token', { credentials: 'include' });
    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      const t = j.csrfToken || j._csrf || j.token;
      if (t) return (__csrfCache = t);
    }
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('CSRF token fetch failed', e);
  }
  return null;
}

function getAuthToken() {
  try {
    // Prefer explicit session/local storage keys
    const fromSession = globalThis.sessionStorage?.getItem('accessToken') || globalThis.sessionStorage?.getItem('justice_token');
    if (fromSession) return fromSession;
    const raw = globalThis.localStorage?.getItem('justiceAuth');
    if (raw) {
  try { const j = JSON.parse(raw); if (j && j.token) return j.token; } catch { /* ignore parse error */ }
    }
    // Fallback: global auth manager (if legacy auth is present)
    const gm = typeof globalThis !== 'undefined' ? globalThis : undefined;
    if (gm && gm.authManager && gm.authManager.token) return gm.authManager.token;
  } catch { /* ignore storage error */ }
  return null;
}

export async function authFetch(input, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});
  if (!headers.has('X-CSRF-Token') && method !== 'GET' && method !== 'HEAD') {
    const t = await ensureCsrfToken();
    if (t) headers.set('X-CSRF-Token', t);
  }
  // Opportunistically add Authorization if available and not already provided
  if (!headers.has('Authorization')) {
    const token = getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers, credentials: init.credentials || 'include' });
}
