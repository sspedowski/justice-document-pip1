// lib/ratelimit/memory.ts
// In-memory rate limiter for dev/local (single-instance only)
// For production, use Upstash or Redis-backed rate limiting

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

export class MemoryRateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly prefix: string;

  constructor(options: { limit: number; windowMs: number; prefix?: string }) {
    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.prefix = options.prefix || 'rl';
  }

  async check(key: string): Promise<{ success: boolean; reset: number }> {
    const now = Date.now();
    const prefixedKey = `${this.prefix}:${key}`;

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      for (const [k, v] of store.entries()) {
        if (v.resetAt < now) store.delete(k);
      }
    }

    const entry = store.get(prefixedKey);

    if (!entry || entry.resetAt < now) {
      // New window
      store.set(prefixedKey, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return { success: true, reset: now + this.windowMs };
    }

    if (entry.count < this.limit) {
      // Within limit
      entry.count++;
      return { success: true, reset: entry.resetAt };
    }

    // Rate limited
    return { success: false, reset: entry.resetAt };
  }
}
