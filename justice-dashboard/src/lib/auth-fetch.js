// Local, self-contained authFetch for the React app.
// No imports outside the app root (Vite-safe).

let __csrfCache = null;
function readCookie(name) {
  try {
    const pattern = new RegExp('(?:^|;\\s*)' + name.replace(/[-.\/\\^$*+?()[\]{}|]/g, '\\$&') + '=([^;]+)');
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
  } catch {}
  return null;
}

export async function authFetch(input, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});
  if (!headers.has('X-CSRF-Token') && method !== 'GET' && method !== 'HEAD') {
    const t = await ensureCsrfToken();
    if (t) headers.set('X-CSRF-Token', t);
  }
  // Optional auth header (uncomment if you store a token)
  // const token = sessionStorage.getItem('accessToken');
  // if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers, credentials: init.credentials || 'include' });
}
