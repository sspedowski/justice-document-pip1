import type { SummarizeJsonRequest, SummarizeJsonResponse, SummarizeJsonSuccess, SummarizeJsonError } from '@/lib/types/summarize';

function isSuccess(x: unknown): x is SummarizeJsonSuccess {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    o.ok === true &&
    typeof o.summary === 'string' &&
    Array.isArray(o.tags) &&
    typeof o.provider === 'string' &&
    typeof o.model === 'string' &&
    typeof o.requestId === 'string' &&
    typeof o.elapsedMs === 'number'
  );
}

function isError(x: unknown): x is SummarizeJsonError {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return o.ok === false && typeof o.error === 'string';
}

/**
 * summarizeJson
 * Typed fetch helper returning a union (never throws for shape mismatches).
 */
export async function summarizeJson(input: SummarizeJsonRequest): Promise<SummarizeJsonResponse> {
  const res = await fetch('/api/summarize/json', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const err: SummarizeJsonError = { ok: false, error: `Unexpected content-type: ${ct}` };
    return err;
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    const err: SummarizeJsonError = { ok: false, error: 'Failed to parse JSON response' };
    return err;
  }
  if (isSuccess(data) || isError(data)) return data;
  const err: SummarizeJsonError = { ok: false, error: 'Response shape mismatch' };
  return err;
}
