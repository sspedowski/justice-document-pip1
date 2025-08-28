// drop-in secure fetch helper
import { getToken, refreshToken, getCsrfToken } from '../../../auth-manager.js';

export async function authFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const csrf = typeof getCsrfToken === 'function' ? getCsrfToken() : null;
  if (csrf) headers.set('X-CSRF-Token', csrf);

  const res = await fetch(input, { ...init, headers, credentials: 'include' });
  if (res.status !== 401) return res;

  // 401 → try one silent refresh, then retry once
  try {
    await refreshToken();
  } catch (e) {
    // ignore
  }
  const newTok = getToken();
  if (newTok) headers.set('Authorization', `Bearer ${newTok}`);
  return fetch(input, { ...init, headers, credentials: 'include' });
}
