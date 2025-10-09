// Browser-side authFetch with SSRF protection
// Relies on the AuthManager exposed from /assets/auth-manager.js
import { getToken as getMgrToken, refreshToken, getCsrfToken } from '/assets/auth-manager.js';

// SSRF protection: allowlist of safe hosts
const ALLOWED_HOSTS = new Set([
  window.location.hostname,
  'api.justice-dashboard.com',
  'localhost',
  '127.0.0.1'
]);

function validateUrl(input) {
  try {
    const url = new URL(input, window.location.origin);
    if (!ALLOWED_HOSTS.has(url.hostname)) {
      throw new Error(`Blocked by SSRF allowlist: ${url.hostname}`);
    }
    return url.href;
  } catch (e) {
    throw new Error(`Invalid URL or blocked by security policy: ${e.message}`);
  }
}

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
  // Validate URL for SSRF protection
  const safeUrl = validateUrl(input);
  
  const headers = new Headers(init.headers || {});
  const token = getAnyToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const csrf = typeof getCsrfToken === 'function' ? getCsrfToken() : (document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || localStorage.getItem('justiceCsrfToken'));
  if (csrf) headers.set('X-CSRF-Token', csrf);

  const res = await fetch(safeUrl, { ...init, headers, credentials: 'include' });
  if (res.status !== 401) return res;

  try { await refreshToken(); } catch {}
  const newTok = getAnyToken();
  if (newTok) headers.set('Authorization', `Bearer ${newTok}`);
  return fetch(safeUrl, { ...init, headers, credentials: 'include' });
}

