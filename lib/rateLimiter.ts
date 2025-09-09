import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '5 m'),
      analytics: true,
      prefix: 'upload',
    })
  : null;

export async function checkLimit(key: string) {
  if (!ratelimit) return { allowed: true, remaining: 999, reset: Date.now() + 60000 };
  const { success, remaining, reset } = await ratelimit.limit(key);
  return { allowed: success, remaining, reset };
}
