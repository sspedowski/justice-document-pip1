export async function authFetch(path, opts = {}) {
  const h = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const res = await fetch(path, { ...opts, headers: h, credentials: "include" });
  return res;
}
