// Lightweight browser bridge used by frontend auth-fetch
// Delegates to window.authManager if present; otherwise returns safe defaults.

export function getToken() {
  try {
    return typeof window !== 'undefined' && window.authManager
      ? (window.authManager.token || null)
      : null;
  } catch {
    return null;
  }
}

export function refreshToken() {
  try {
    if (typeof window !== 'undefined' && window.authManager && typeof window.authManager.refreshToken === 'function') {
      return window.authManager.refreshToken();
    }
  } catch {
    // ignore
  }
  return Promise.resolve(null);
}

export function getCsrfToken() {
  try {
    if (typeof window !== 'undefined' && window.authManager && typeof window.authManager.getCsrfToken === 'function') {
      return window.authManager.getCsrfToken();
    }
    const meta = typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]') : null;
    return meta ? meta.getAttribute('content') : null;
  } catch {
    return null;
  }
}
