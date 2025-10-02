import { NextRequest } from 'next/server';
import { MAX_LEN, framesForText, encodeFrame } from '@/lib/summarize/frames.mjs';

type Frame = ReturnType<typeof framesForText> extends Generator<infer F> ? F : never;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  const text = typeof body === 'object' && body && 'text' in body ? (body as { text?: unknown }).text : undefined;
  if (typeof text !== 'string' || !text.length) return new Response('`text` (string) is required', { status: 400 });
  if ((text as string).length > MAX_LEN) return new Response('`text` too long', { status: 413 });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (f: Frame) => controller.enqueue(new TextEncoder().encode(encodeFrame(f)));
      // Materialize generator with small sleeps to simulate work
  const iter = framesForText(text as string);
      for (const frame of iter) {
        push(frame);
        if (frame.stage !== 'result' && frame.stage !== 'end') await sleep(50);
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}

// Re-export for tests (kept for backwards compatibility with earlier test import)
export const __framesForTest = framesForText;
