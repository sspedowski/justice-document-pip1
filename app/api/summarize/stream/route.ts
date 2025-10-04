// Dedicated SSE streaming endpoint: /api/summarize/stream
import { type SSEFrame, type SummarizeRequest } from '@/lib/types/summarize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

function frameToSSE(frame: SSEFrame): Uint8Array {
  // Minimal: every frame as a single `data:` line + blank line
  const payload = `data: ${JSON.stringify(frame)}\n\n`;
  return encoder.encode(payload);
}

const sseHeaders: HeadersInit = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no'
};

async function buildStream(req: Request): Promise<ReadableStream<Uint8Array>> {
  let payload: SummarizeRequest | undefined;
  try {
    payload = await req.json();
  } catch {
    payload = undefined;
  }
  const text = typeof payload?.text === 'string' ? payload!.text : '';

  // Import lazily if needed to keep route cold starts small
  const { summarizeFrames } = await import('@/lib/summarize/frames.mjs');

  return new ReadableStream<Uint8Array>({
    async start(controller: ReadableStreamDefaultController<Uint8Array>) {
      try {
        for await (const frame of summarizeFrames({ text })) {
          controller.enqueue(frameToSSE(frame as SSEFrame));
        }
      } catch (err) {
        const errorFrame: SSEFrame = {
          stage: 'error',
          error: String(err),
        };
        controller.enqueue(frameToSSE(errorFrame));
      } finally {
        controller.close();
      }
    },
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
