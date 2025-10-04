// Guarded JSON fetch utility: prevents hard crashes when endpoint returns non-JSON (e.g. SSE or HTML/banner)
export type SafeJson<T> =
  | { ok: true; status: number; json: T; nonJson: false }
  | { ok: false; status: number; json: null; nonJson: true; body: string }
  | { ok: false; status: number; json: null; nonJson: false; parseError: string; raw: string };

export async function safeFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeJson<T>> {
  const res = await fetch(input, init);
  const ct = res.headers.get('content-type') || '';
  let body: string;
  try {
    body = await res.text();
  } catch (e) {
    return { ok: false, status: res.status, json: null, nonJson: true, body: `<<unreadable: ${e}>>` };
  }

  if (!ct.includes('application/json')) {
    return { ok: false, status: res.status, json: null, nonJson: true, body };
  }
  try {
    const parsed = JSON.parse(body) as T;
    if (!res.ok) {
      return { ok: false, status: res.status, json: null, nonJson: false, parseError: 'HTTP error', raw: body };
    }
    return { ok: true, status: res.status, json: parsed, nonJson: false };
  } catch (e) {
    return {
      ok: false,
      status: res.status,
      json: null,
      nonJson: false,
      parseError: String(e),
      raw: body,
    };
  }
}
