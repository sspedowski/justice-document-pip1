import { z } from 'zod';

// Defaults for local/dev when not explicitly set
const DEFAULT_ALLOWED_DEV = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const RawEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REQUIRE_AUTH: z.string().optional(), // "1" to enable
  INTERNAL_API_TOKEN: z.string().optional(),

  UPLOAD_ALLOWED_MIME: z.string().optional(),
  UPLOAD_MAX_BYTES: z.string().optional(),

  // Optional providers
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  // Optional rate limiting via Upstash
  RATE_LIMIT: z.string().optional(), // "1" to enable
  RATE_LIMIT_MAX: z.string().optional(),
  RATE_LIMIT_WINDOW: z.string().optional(), // e.g. "1 m"
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export type AppEnv = ReturnType<typeof getEnv>;

// Compute a fresh, validated snapshot each time (handy for tests that mutate process.env)
export function getEnv() {
  const raw = RawEnv.parse(process.env);

  const requireAuth = raw.REQUIRE_AUTH === '1' || raw.NODE_ENV === 'production';
  if (requireAuth && !raw.INTERNAL_API_TOKEN) {
    throw new Error('INTERNAL_API_TOKEN is required when auth is enabled');
  }

  const allowedFromEnv = (raw.UPLOAD_ALLOWED_MIME ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowed = allowedFromEnv.length
    ? allowedFromEnv
    : raw.NODE_ENV === 'production'
      ? ['application/pdf']
      : DEFAULT_ALLOWED_DEV;

  const maxBytes = Number(raw.UPLOAD_MAX_BYTES ?? 25 * 1024 * 1024);

  const blob = {
    enabled: Boolean(raw.BLOB_READ_WRITE_TOKEN),
    token: raw.BLOB_READ_WRITE_TOKEN,
  } as const;

  const kv = {
    enabled: Boolean(raw.KV_REST_API_URL && raw.KV_REST_API_TOKEN),
    url: raw.KV_REST_API_URL,
    token: raw.KV_REST_API_TOKEN,
  } as const;

  const rateLimit = {
    enabled:
      raw.RATE_LIMIT === '1' &&
      Boolean(raw.UPSTASH_REDIS_REST_URL && raw.UPSTASH_REDIS_REST_TOKEN),
    max: Number(raw.RATE_LIMIT_MAX ?? 20),
    window: String(raw.RATE_LIMIT_WINDOW ?? '1 m'),
    upstash: {
      url: raw.UPSTASH_REDIS_REST_URL,
      token: raw.UPSTASH_REDIS_REST_TOKEN,
    },
  } as const;

  return {
    nodeEnv: raw.NODE_ENV,
    requireAuth,
    internalApiToken: raw.INTERNAL_API_TOKEN,
    upload: {
      allowed,
      maxBytes,
    },
    providers: {
      blob,
      kv,
    },
    rateLimit,
  } as const;
}

