// Streaming summarize endpoint (SSE). Uses dynamic import to keep tests framework-neutral.
export async function POST(req: Request) {
  const { summarizeFrames, frameToSSE } = await import('@/lib/summarize/frames.mjs');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let payload = {};
        try { payload = await req.json(); } catch {}
        const text = typeof payload === 'object' && payload && 'text' in payload ? (payload).text : '';
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

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
      'connection': 'keep-alive'
    }
  });
}
