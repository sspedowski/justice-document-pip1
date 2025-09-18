// app/api/rtdb/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getRtdb, verifyAppCheck } from "../../../lib/firebaseAdmin"

export const runtime = "nodejs"
export const preferredRegion = ["iad1"]


type PostBody = {
  path: string
  data?: unknown
  method?: "set" | "push"
}

export async function POST(req: NextRequest) {
  try {
    const appCheckToken = req.headers.get("X-Firebase-AppCheck")
    const isVerified = await verifyAppCheck(appCheckToken || undefined)
    if (!isVerified) {
      return NextResponse.json({ ok: false, error: "App Check verification failed" }, { status: 401 })
    }

    // Optional auth:
    // const auth = req.headers.get("authorization")
    // if (!auth?.startsWith("Bearer ")) return NextResponse.json({ ok:false, error:"Missing bearer token" }, { status: 401 })
    // await verifyIdToken(auth.slice("Bearer ".length))

    const { path, data, method = "set" } = (await req.json()) as PostBody
    if (!path) return NextResponse.json({ ok:false, error:'Missing "path"' }, { status: 400 })

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
    const appCheckToken = req.headers.get("X-Firebase-AppCheck")
    const isVerified = await verifyAppCheck(appCheckToken || undefined)
    if (!isVerified) {
      return NextResponse.json({ ok: false, error: "App Check verification failed" }, { status: 401 })
    }

    const url = new URL(req.url)
    const path = url.searchParams.get("path")
    if (!path) return NextResponse.json({ ok:false, error:'Missing "path"' }, { status: 400 })

    const snap = await getRtdb().ref(path).get()
    return NextResponse.json({ ok:true, exists: snap.exists(), value: snap.val() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok:false, error: message }, { status: 500 })
  }
}