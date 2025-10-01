import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const preferredRegion = ['iad1'];

// Simple SSE progress simulation / scaffold. Replace model call when integrating.
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const send = async (data: unknown) => {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(payload));
  };

  // Begin stream
  await send({ stage: 'start' });

  try {
    const body = await req.json().catch(() => ({}));
    const text: string = (body && typeof body.text === 'string' ? body.text : '') || '';
    const total = Math.min(Math.max(text.length || 10, 10), 2000);
    let emitted = 0;

    while (emitted < total) {
      const chunk = Math.min(50, total - emitted);
      emitted += chunk;
      const progress = Math.round((emitted / total) * 100);
      await send({ stage: 'progress', progress });
      await new Promise(r => setTimeout(r, 40));
    }

    // Final result placeholder
    await send({ stage: 'result', summary: `Processed ${total} chars`, tokensUsed: total });
    await send({ stage: 'end' });
  } catch (err) {
    await send({ stage: 'error', message: 'Internal error' });
  } finally {
    await writer.close();
  }

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
