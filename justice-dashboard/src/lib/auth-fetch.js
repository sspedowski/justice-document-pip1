const DEFAULT_INIT = { credentials: 'include' };

export async function authFetch(input, init = undefined) {
  const opts = init ? { ...DEFAULT_INIT, ...init } : { ...DEFAULT_INIT };
  const res = await fetch(input, opts);
  if (!res.ok) {
    throw new Error(`authFetch failed with status ${res.status}`);
  }
  return res;
}
