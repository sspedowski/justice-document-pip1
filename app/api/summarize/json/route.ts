// Aggregated (non-SSE) summarization endpoint: /api/summarize/json
// Consumes the same frame generator and returns the final 'done' frame (Claude) or
// synthesizes from fallback frames when Claude is not active.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function collect(text) {
  const { summarizeFrames } = await import('@/lib/summarize/frames.mjs');
  let result = {
    ok: false,
    summary: '',
    tags: [],
    provider: undefined,
    model: undefined,
    error: undefined
  };
  try {
    for await (const frame of summarizeFrames({ text })) {
      if (frame?.stage === 'done') {
        result.ok = frame.ok !== false;
        result.summary = frame.summary || '';
        result.tags = frame.tags || [];
        result.provider = frame.provider;
        result.model = frame.model;
        if (frame.error) {
          result.ok = false;
          result.error = frame.error;
        }
      }
      if (frame?.stage === 'result') {
        // Fallback mock summarizer path; store interim result
        result.summary = frame.result || '';
      }
      if (frame?.stage === 'end') {
        // Fallback final
        result.ok = frame.ok !== false && result.ok !== false;
      }
    }
  } catch (e: unknown) {
    result.ok = false;
    result.error = e instanceof Error ? e.message : String(e);
  }
  if (!result.ok && !result.error) {
    result.error = 'SUMMARY_FAILED';
  }
  return result;
}

function extractTextFromBody(body) {
  if (!body) return '';
  if (typeof body.text === 'string') return body.text;
  return '';
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try { body = await req.json() as Record<string, unknown>; } catch {}
  const text = extractTextFromBody(body);
  const result = await collect(text);
  return Response.json(result, { status: result.ok ? 200 : 500 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = url.searchParams.get('text') || '';
  const result = await collect(text);
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
