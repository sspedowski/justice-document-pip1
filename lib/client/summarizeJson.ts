// lib/client/summarizeJson.ts
// Typed client for /api/summarize/json with safety guards

export type SummarizeJsonResult = {
  ok: boolean;
  summary?: string;
  tags?: string[];
  provider?: string;
  model?: string;
  error?: string;
  requestId?: string;
  elapsedMs?: number;
};

function isSummarizeJsonResult(v: unknown): v is SummarizeJsonResult {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  const ok = typeof o.ok === 'boolean';
  const summaryOk = o.summary === undefined || typeof o.summary === 'string';
  const tagsOk = o.tags === undefined || Array.isArray(o.tags);
  return ok && summaryOk && tagsOk;
}

/**
 * Calls /api/summarize/json safely.
 * Throws if non-JSON or unexpected shape.
 *
 * @param input - Text to summarize
 * @param init - Optional fetch RequestInit
 * @returns Promise<SummarizeJsonResult>
 * @throws Error if response is invalid or request fails
 */
export async function summarizeJson(
  input: string,
  init?: RequestInit
): Promise<SummarizeJsonResult> {
  const res = await fetch('/api/summarize/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: JSON.stringify({ text: input }),
    ...init,
  });

  const ct = res.headers.get('content-type') || '';
  const raw = await res.text();

  if (!ct.includes('application/json')) {
    throw new Error(`Non-JSON response: ${ct} head="${raw.slice(0, 120)}"`);
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON: ${String(e)} head="${raw.slice(0, 120)}"`);
  }

  if (!isSummarizeJsonResult(data)) {
    throw new Error(`Unexpected shape: ${raw.slice(0, 160)}`);
  }

  if (!res.ok || !data.ok) {
    const msg = (data as SummarizeJsonResult).error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
