// Local, self-contained authFetch for the React app.
// No imports outside the app root (Vite-safe).

export async function authFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});

  // Optional: Attach CSRF token from cookie if present
  try {
    const m = typeof document !== 'undefined' && document.cookie
      ? document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/)
      : null;
    if (m && !headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', decodeURIComponent(m[1]));
  } catch {}

  // Optional: Attach Bearer token from sessionStorage or other store
  // const token = sessionStorage.getItem('accessToken');
  // if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials || 'include'
  });
}
