import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/config/env";

export function middleware(req: NextRequest) {
  const { REQUIRE_AUTH, INTERNAL_API_TOKEN } = env();

  // Health always allowed
  if (req.nextUrl.pathname === "/api/health") {
    return NextResponse.json({ ok: true });
  }

  if (REQUIRE_AUTH === "1") {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token || token !== INTERNAL_API_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
