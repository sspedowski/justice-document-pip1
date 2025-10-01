import { NextRequest } from 'next/server';

type Stage =
  | 'queued'
  | 'fetching'
  | 'chunking'
  | 'summarizing'
  | 'result'
  | 'end';

type Frame =
  | { stage: Exclude<Stage, 'result' | 'end'>; progress?: number }
  | { stage: 'result'; result: string }
  | { stage: 'end'; ok: true };

const MAX_LEN = 4000;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const encode = (f: Frame) => `data: ${JSON.stringify(f)}\n\n`;

export async function POST(req: NextRequest) {
  let json: unknown;
  try { json = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  const text = (json as any)?.text;
  if (typeof text !== 'string' || !text.length) return new Response('`text` (string) is required', { status: 400 });
  if (text.length > MAX_LEN) return new Response('`text` too long', { status: 413 });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (f: Frame) => controller.enqueue(new TextEncoder().encode(encode(f)));
      push({ stage: 'queued' });
      await sleep(50); push({ stage: 'fetching', progress: 10 });
      await sleep(50); push({ stage: 'chunking', progress: 35 });
      await sleep(50); push({ stage: 'summarizing', progress: 70 });
      await sleep(50);
      const result = `Summary (${Math.min(text.length, 140)} chars): ${text.slice(0,140)}${text.length>140?'…':''}`;
      push({ stage: 'result', result });
      push({ stage: 'end', ok: true });
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

export function* __framesForTest(text: string): Generator<Frame> {
  if (!text || text.length > MAX_LEN) throw new Error('bad input');
  yield { stage: 'queued' }; yield { stage: 'fetching', progress: 10 }; yield { stage: 'chunking', progress: 35 }; yield { stage: 'summarizing', progress: 70 };
  yield { stage: 'result', result: `Summary (${Math.min(text.length, 140)} chars): ${text.slice(0,140)}${text.length>140?'…':''}` };
  yield { stage: 'end', ok: true };
}
