// Browser-side authFetch used by legacy page
// Relies on the AuthManager exposed from /assets/auth-manager.js
import { getToken as getMgrToken, refreshToken, getCsrfToken } from '/assets/auth-manager.js';

function getAnyToken() {
  try {
    const t = getMgrToken();
    if (t) return t;
  } catch {}
  try {
    const raw = localStorage.getItem('justiceAuth');
    if (raw) { const j = JSON.parse(raw); if (j && j.token) return j.token; }
  } catch {}
  try {
    const s = sessionStorage.getItem('justice_token') || sessionStorage.getItem('accessToken');
    if (s) return s;
  } catch {}
  return null;
}

export async function authFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  const token = getAnyToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const csrf = typeof getCsrfToken === 'function' ? getCsrfToken() : (document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || localStorage.getItem('justiceCsrfToken'));
  if (csrf) headers.set('X-CSRF-Token', csrf);

  const res = await fetch(input, { ...init, headers, credentials: 'include' });
  if (res.status !== 401) return res;

  try { await refreshToken(); } catch {}
  const newTok = getAnyToken();
  if (newTok) headers.set('Authorization', `Bearer ${newTok}`);
  return fetch(input, { ...init, headers, credentials: 'include' });
}

