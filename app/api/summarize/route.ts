import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Optional payload, e.g., { jobId, items }
  await req.json().catch(() => ({}));

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: any) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

      send({ stage: 'queued', progress: 0.05 });
      await new Promise(r => setTimeout(r, 200));
      send({ stage: 'fetching', progress: 0.2 });
      await new Promise(r => setTimeout(r, 300));
      send({ stage: 'chunking', progress: 0.5 });
      await new Promise(r => setTimeout(r, 400));
      send({ stage: 'summarizing', progress: 0.8 });
      await new Promise(r => setTimeout(r, 400));
      send({ stage: 'done', progress: 1.0, result: 'Summary text…' });
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
