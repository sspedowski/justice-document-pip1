// middleware.ts
// Global middleware: allow Vercel preview bypass everywhere; rate limit summarize endpoints.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { MemoryRateLimiter } from '@/lib/ratelimit/memory';

export const config = {
  // Apply to all dynamic paths except Next internals and static assets
  matcher: ['/((?!_next|favicon.ico|public/).*)'],
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
  // Allow Vercel preview protection bypass (for smoke tests)
  const bypassToken =
    req.headers.get('x-vercel-protection-bypass') ??
    req.nextUrl.searchParams.get('vercel-protection-bypass') ??
    req.cookies.get('vercel-protection-bypass')?.value;

  const host = req.headers.get('host') || '';
  const isVercelPreviewHost = host.endsWith('.vercel.app');

  if (bypassToken && isVercelPreviewHost) {
    // Optional: verify against env if you want strict validation
    // if (bypassToken === process.env.VERCEL_BYPASS_TOKEN) { return; }
    return NextResponse.next();
  }

  // Only rate-limit summarize endpoints
  const path = req.nextUrl.pathname;
  const isSummarize = path.startsWith('/api/summarize');
  if (!isSummarize) {
    return NextResponse.next();
  }

  const ip =
    req.ip ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  const { success, reset } = await ratelimit.check(`summ:${ip}`);

  if (success) return NextResponse.next();

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
