// Legacy summarize route now returns JSON pointer directing clients to the new streaming endpoint.

function moved() {
  return Response.json({
    error: 'MOVED_TO_SSE',
    message: 'Use /api/summarize/stream with Accept: text/event-stream.',
    next: '/api/summarize/stream'
  }, { status: 410 });
}

export async function GET() { return moved(); }
export async function POST() { return moved(); }
