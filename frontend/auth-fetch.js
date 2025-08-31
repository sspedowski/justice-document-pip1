// Browser-side authFetch used by legacy page
// Relies on the AuthManager exposed from /assets/auth-manager.js
import { getToken, refreshToken, getCsrfToken } from '/assets/auth-manager.js';

export async function authFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const csrf = typeof getCsrfToken === 'function' ? getCsrfToken() : null;
  if (csrf) headers.set('X-CSRF-Token', csrf);

  const res = await fetch(input, { ...init, headers, credentials: 'include' });
  if (res.status !== 401) return res;

  try { await refreshToken(); } catch {}
  const newTok = getToken();
  if (newTok) headers.set('Authorization', `Bearer ${newTok}`);
  return fetch(input, { ...init, headers, credentials: 'include' });
}

