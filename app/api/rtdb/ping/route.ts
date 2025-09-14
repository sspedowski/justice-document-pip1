import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/rtdb/ping",
    node: process.version,
    at: new Date().toISOString(),
  });
}

