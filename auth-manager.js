/* eslint-env browser */
// Lightweight browser bridge used by frontend auth-fetch
// Delegates to window.authManager if present; otherwise returns safe defaults.

export function getToken() {
  try {
    const gm = typeof globalThis !== 'undefined' ? globalThis : undefined;
    return gm && gm.authManager ? (gm.authManager.token || null) : null;
  } catch {
    return null;
  }
}

export function refreshToken() {
  try {
    const gm = typeof globalThis !== 'undefined' ? globalThis : undefined;
    if (gm && gm.authManager && typeof gm.authManager.refreshToken === 'function') {
      return gm.authManager.refreshToken();
    }
  } catch {
    // ignore
  }
  return Promise.resolve(null);
}

export function getCsrfToken() {
  try {
    const gm = typeof globalThis !== 'undefined' ? globalThis : undefined;
    if (gm && gm.authManager && typeof gm.authManager.getCsrfToken === 'function') {
      return gm.authManager.getCsrfToken();
    }
    const d = gm && gm.document ? gm.document : undefined;
    const meta = d ? d.querySelector('meta[name="csrf-token"]') : null;
    return meta ? meta.getAttribute('content') : null;
  } catch {
    return null;
  }
}
