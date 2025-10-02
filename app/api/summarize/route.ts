// Streaming summarize endpoint (SSE). Uses dynamic import to keep tests framework-neutral.

function notAcceptableJSON() {
  return Response.json({
    error: 'NOT_ACCEPTABLE',
    message: 'This endpoint streams Server-Sent Events. Supply Accept: text/event-stream.',
    hint: {
      client: "fetch('/api/summarize', { method: 'POST', headers: { Accept: 'text/event-stream', 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '...' }) })"
    }
  }, { status: 406 });
}

async function buildStream(req: Request) {
  const { summarizeFrames, frameToSSE } = await import('@/lib/summarize/frames.mjs');
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        let payload: any = {};
        try { payload = await req.json(); } catch {}
        const text = typeof payload === 'object' && payload && 'text' in payload ? payload.text : '';
        for await (const frame of summarizeFrames({ text: typeof text === 'string' ? text : '' })) {
          controller.enqueue(encoder.encode(frameToSSE(frame)));
        }
      } catch (err) {
        controller.enqueue(encoder.encode(frameToSSE({ stage: 'end', ok: false, error: String(err) })));
      } finally {
        controller.close();
      }
    }
  });
}

export async function GET(req: Request) {
  const accept = req.headers.get('accept') || '';
  if (!accept.includes('text/event-stream')) return notAcceptableJSON();
  const stream = await buildStream(req);
  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
      'connection': 'keep-alive'
    }
  });
}

export async function POST(req: Request) {
  const accept = req.headers.get('accept') || '';
  if (!accept.includes('text/event-stream')) return notAcceptableJSON();
  const stream = await buildStream(req);
  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
      'connection': 'keep-alive'
    }
  });
}
