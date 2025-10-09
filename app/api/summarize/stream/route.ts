// Dedicated SSE streaming endpoint: /api/summarize/stream
import '../../../../src/lib/env.schema.ts';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sseHeaders: Record<string,string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no'
};

async function buildStream(req: Request) {
  const { summarizeFrames, frameToSSE } = await import('@/lib/summarize/frames.mjs');
  const encoder = new TextEncoder();
  const requestId = crypto.randomUUID();
  const t0 = Date.now();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(`: connected ${Date.now()}\n\n`));
      let payload: Record<string, unknown> = {};
      try { payload = await req.json() as Record<string, unknown>; } catch {}
      const text = typeof payload?.text === 'string' ? payload.text : '';
      try {
        let lastFrame: Record<string, unknown> | null = null;
        for await (const frame of summarizeFrames({ text })) {
          lastFrame = frame as unknown as Record<string, unknown>;
          controller.enqueue(encoder.encode(frameToSSE(frame)));
        }
        // Add tracking to final frame
        const finalFrame = {
          ...(lastFrame || {}),
          requestId,
          elapsedMs: Date.now() - t0,
        };
        controller.enqueue(encoder.encode(`event: end\ndata: ${JSON.stringify(finalFrame)}\n\n`));
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({
          message: errMsg,
          requestId,
          elapsedMs: Date.now() - t0
        })}\n\n`));
      } finally {
        controller.close();
      }
    }
  });
}

export async function POST(req: Request) {
  const stream = await buildStream(req);
  return new Response(stream, { headers: sseHeaders });
}

export async function GET(req: Request) {
  const stream = await buildStream(req);
  return new Response(stream, { headers: sseHeaders });
}
