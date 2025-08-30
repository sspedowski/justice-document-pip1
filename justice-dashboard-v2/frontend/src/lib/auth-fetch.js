export async function authFetch(input, init = {}) {
  const go = () => fetch(input, { credentials: "include", ...init });
  let res = await go();
  if (res.status === 401) {
    const r = await fetch("/api/refresh", { method: "POST", credentials: "include" });
    if (r.ok) res = await go();
  }
  return res;
}

let timer;
export function startRefreshLoop(ms = 10 * 60 * 1000) {
  stopRefreshLoop();
  timer = setInterval(() => {
    fetch("/api/refresh", { method: "POST", credentials: "include" });
  }, ms);
}
export function stopRefreshLoop() {
  if (timer) clearInterval(timer), (timer = null);
}
