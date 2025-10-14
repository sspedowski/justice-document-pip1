// app/api/rtdb/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getRtdb, verifyIdToken /*, verifyAppCheck */ } from "@/lib/firebaseAdmin"
import { env } from "@/lib/env"
import { MemoryRateLimiter } from "@/lib/ratelimit/memory"
import { z } from "zod"

export const runtime = "nodejs"
export const preferredRegion = ["iad1"]

// Rate limiter: 20 requests per minute per user/IP
const rtdbRateLimiter = new MemoryRateLimiter({
  limit: 20,
  windowMs: 60_000,
  prefix: "rtdb"
})


const PostBodySchema = z.object({
  path: z.string().min(1).max(256).regex(/^[a-zA-Z0-9/_-]+$/),
  data: z.unknown().optional(),
  method: z.enum(["set", "push"]).optional().default("set")
});

const GetQuerySchema = z.object({
  path: z.string().min(1).max(256).regex(/^[a-zA-Z0-9/_-]+$/)
});

export async function POST(req: NextRequest) {
  try {
    const AUTH_REQUIRED = env.RTDB_REQUIRE_AUTH !== "false"
    if (!AUTH_REQUIRED && process.env.NODE_ENV !== "production") {
      console.warn("[rtdb] ⚠️  AUTH DISABLED via RTDB_REQUIRE_AUTH=false (dev only)")
    }

    // --- Extract client IP ---
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.ip ||
      "127.0.0.1"

    // --- Verify auth token (if required) ---
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined
    let uid: string | null = null

    if (token) {
      try {
        const decoded = await verifyIdToken(token)
        uid = decoded.uid
      } catch (err) {
        if (AUTH_REQUIRED) {
          return NextResponse.json(
            { ok: false, error: "INVALID_TOKEN" },
            { status: 401 }
          )
        }
      }
    } else if (AUTH_REQUIRED) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    // --- Rate limiting (per user if authenticated, else per IP) ---
    const rlKey = uid ? `user:${uid}` : `ip:${ip}`
    const { success, reset } = await rtdbRateLimiter.check(rlKey)
    if (!success) {
      const retryAfterMs = Math.max(0, reset - Date.now())
      return NextResponse.json(
        { ok: false, error: "RATE_LIMITED", retryAfterMs },
        {
          status: 429,
          headers: { "retry-after": String(Math.ceil(retryAfterMs / 1000)) }
        }
      )
    }

    // --- Parse and validate body ---
    const body = await req.json()
    const parsed = PostBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
    }
    const { path, data, method } = parsed.data

    // --- Provenance metadata ---
    const meta = {
      by: uid ? `user:${uid}` : "server",
      ts: Date.now()
    }

    const db = getRtdb()
    const ref = db.ref(path)

    if (method === "push") {
      const newRef = ref.push()
      await newRef.set(data ? { ...data, meta } : { ok: true, meta })
      return NextResponse.json({ ok: true, mode: "push", key: newRef.key })
    }

    await ref.set(data ? { ...data, meta } : { ok: true, meta })
    return NextResponse.json({ ok: true, mode: "set" })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok:false, error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const pathParam = url.searchParams.get("path")
    const parsed = GetQuerySchema.safeParse({ path: pathParam })
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid path parameter' }, { status: 400 })
    }
    const { path } = parsed.data

    const snap = await getRtdb().ref(path).get()
    return NextResponse.json({ ok:true, exists: snap.exists(), value: snap.val() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok:false, error: message }, { status: 500 })
  }
}
