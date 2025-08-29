export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => localStorage.setItem("token", t);

export async function authFetch(path, opts = {}) {
  const h = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  const res = await fetch(path, { ...opts, headers: h });
  if (res.status === 401) localStorage.removeItem("token");
  return res;
}

