// Dedicated SSE streaming endpoint: /api/summarize/stream
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
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(`: connected ${Date.now()}\n\n`));
      let payload: any = {};
      try { payload = await req.json(); } catch {}
      const text = typeof payload?.text === 'string' ? payload.text : '';
      try {
        for await (const frame of summarizeFrames({ text })) {
          controller.enqueue(encoder.encode(frameToSSE(frame)));
        }
        controller.enqueue(encoder.encode('event: end\ndata: {}\n\n'));
      } catch (err:any) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: String(err) })}\n\n`));
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
