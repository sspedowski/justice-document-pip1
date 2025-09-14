// app/api/rtdb/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getRtdb, verifyIdToken, verifyAppCheck } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

// Toggle auth for quick local smoke tests (set RTDB_REQUIRE_AUTH=false in .env.local)
const AUTH_REQUIRED = process.env.RTDB_REQUIRE_AUTH !== "false"

async function requireAuth(req: NextRequest) {
  if (!AUTH_REQUIRED) return { ok: true as const, who: "dev-bypass" }

  const auth = req.headers.get("authorization")
  const appCheckToken = req.headers.get("x-firebase-appcheck")

  // 1) Prefer Firebase ID token (Authorization: Bearer <ID_TOKEN>)
  if (auth?.startsWith("Bearer ")) {
    const idToken = auth.slice("Bearer ".length)
    try {
      const decoded = await verifyIdToken(idToken)
      return { ok: true as const, who: decoded.uid }
    } catch {
      // fall through to App Check
    }
  }

  // 2) Accept valid App Check token if provided
  if (appCheckToken) {
    const valid = await verifyAppCheck(appCheckToken)
    if (valid) return { ok: true as const, who: "app-check" }
  }

  return { ok: false as const, error: "Unauthorized (need Bearer ID token or valid App Check)" }
}

type PostBody = {
  path: string
  data?: unknown
  method?: "set" | "push"
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })

  try {
    const { path, data, method = "set" } = (await req.json()) as PostBody
    if (!path) return NextResponse.json({ ok: false, error: 'Missing "path"' }, { status: 400 })

    const db = getRtdb()
    const ref = db.ref(path)

    // Add simple provenance if you like
    const payload = data ?? { ok: true, ts: Date.now(), by: auth.who }

    if (method === "push") {
      const newRef = ref.push()
      await newRef.set(payload)
      return NextResponse.json({ ok: true, mode: "push", key: newRef.key })
    }

    await ref.set(payload)
    return NextResponse.json({ ok: true, mode: "set" })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ ok: false, error: error?.message ?? "Unknown error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 })

  try {
    const url = new URL(req.url)
    const path = url.searchParams.get("path")
    if (!path) return NextResponse.json({ ok: false, error: 'Missing "path"' }, { status: 400 })

    const snap = await getRtdb().ref(path).get()
    return NextResponse.json({ ok: true, exists: snap.exists(), value: snap.val() })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ ok: false, error: error?.message ?? "Unknown error" }, { status: 500 })
  }
}
