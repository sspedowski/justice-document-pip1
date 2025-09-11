import { z } from "zod";

const Schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  REQUIRE_AUTH: z.string().optional(),
  INTERNAL_API_TOKEN: z.string().optional(),

  UPLOAD_ALLOWED_MIME: z.string().optional(),                 // "application/pdf,image/png"
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(25 * 1024 * 1024),

  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Optional / env-gated features
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  RATE_LIMIT: z.coerce.boolean().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_WINDOW: z.string().default("1 m")
});

export type Env = ReturnType<typeof env>;

let cached: any;

export function env() {
  if (cached) return cached;
  const parsed = Schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = JSON.stringify(parsed.error.flatten().fieldErrors);
    throw new Error(`Invalid environment configuration: ${msg}`);
  }
  const e = parsed.data;

  const allowedMime = e.UPLOAD_ALLOWED_MIME
    ? e.UPLOAD_ALLOWED_MIME.split(",").map(s => s.trim()).filter(Boolean)
    : e.NODE_ENV === "production"
      ? ["application/pdf"] // safer default in prod
      : [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

  cached = { ...e, allowedMime };
  return cached;
}
