// app/api/rtdb/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getRtdb /*, verifyIdToken, verifyAppCheck */ } from "../../../lib/firebaseAdmin"
import { z } from "zod"

export const runtime = "nodejs"
export const preferredRegion = ["iad1"]


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
    // Optional auth:
    // const auth = req.headers.get("authorization")
    // if (!auth?.startsWith("Bearer ")) return NextResponse.json({ ok:false, error:"Missing bearer token" }, { status: 401 })
    // await verifyIdToken(auth.slice("Bearer ".length))
    // const appCheckToken = getAppCheckToken(req)
    // if (appCheckToken) { await verifyAppCheck(appCheckToken) }

    const body = await req.json()
    const parsed = PostBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
    }
    const { path, data, method } = parsed.data

    const db = getRtdb()
    const ref = db.ref(path)

    if (method === "push") {
      const newRef = ref.push()
      await newRef.set(data ?? { ok: true, ts: Date.now() })
      return NextResponse.json({ ok: true, mode: "push", key: newRef.key })
    }

    await ref.set(data ?? { ok: true, ts: Date.now() })
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
