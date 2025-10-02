// Guarded JSON fetch utility: prevents hard crashes when endpoint returns non-JSON (e.g. SSE or HTML/banner)
export interface SafeFetchJsonResult<T=unknown> {
  ok: boolean;
  status: number;
  json: T | null;
  nonJson?: boolean;
  body?: string; // raw body when nonJson
  parseError?: string;
  raw?: string; // raw body when parse error
}

export async function safeFetchJson<T=unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<SafeFetchJsonResult<T>> {
  const res = await fetch(input, init);
  const status = res.status;
  const ct = res.headers.get('content-type') || '';
  let text: string;
  try {
    text = await res.text(); // always read once
  } catch (e) {
    return { ok: res.ok, status, json: null, nonJson: true, body: `<<unreadable body: ${e}>>` };
  }

  if (!ct.includes('application/json')) {
    return { ok: res.ok, status, json: null, nonJson: true, body: text };
  }
  try {
    const parsed = JSON.parse(text) as T;
    return { ok: res.ok, status, json: parsed };
  } catch (e:any) {
    return { ok: false, status, json: null, parseError: String(e), raw: text };
  }
}
