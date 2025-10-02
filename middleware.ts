// middleware.ts
// Rate limiting for summarize endpoints
import type { NextRequest } from 'next/server';
import { MemoryRateLimiter } from '@/lib/ratelimit/memory';

export const config = {
  matcher: ['/api/summarize/(stream|json)'],
};

// In-memory limiter for dev/single-instance
// For production with multiple instances, use Upstash:
// import { Ratelimit } from '@upstash/ratelimit';
// import { Redis } from '@upstash/redis';
// const redis = Redis.fromEnv();
// const ratelimit = new Ratelimit({
//   redis,
//   limiter: Ratelimit.slidingWindow(20, '1 m'),
//   analytics: true,
//   prefix: 'rl:summarize',
// });

const ratelimit = new MemoryRateLimiter({
  limit: 20, // 20 requests per window
  windowMs: 60 * 1000, // 1 minute
  prefix: 'rl:summarize',
});

export async function middleware(req: NextRequest) {
  const ip =
    req.ip ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  const { success, reset } = await ratelimit.check(`summ:${ip}`);

  if (success) return;

  const ms = Math.max(0, reset - Date.now());
  return new Response(
    JSON.stringify({
      ok: false,
      error: 'RATE_LIMITED',
      retryAfterMs: ms,
    }),
    {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'retry-after': String(Math.ceil(ms / 1000)),
      },
    }
  );
}
