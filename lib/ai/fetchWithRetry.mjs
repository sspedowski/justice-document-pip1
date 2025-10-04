// lib/ai/fetchWithRetry.mjs
export async function fetchWithRetry(url, init = {}, { tries = 3, timeoutMs = 30000, backoffMs = 600 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(new Error('timeout')), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ac.signal });
      clearTimeout(t);
      if (res.ok || res.status < 500) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
    await new Promise(r => setTimeout(r, backoffMs * (i + 1)));
  }
  throw lastErr;
}
