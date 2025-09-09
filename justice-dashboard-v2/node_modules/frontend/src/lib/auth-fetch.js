export async function authFetch(input, init = {}) {
  return fetch(input, { credentials: "include", ...init });
}
