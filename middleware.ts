import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const REQUIRE = process.env.REQUIRE_AUTH === '1';
  const TOKEN = process.env.INTERNAL_API_TOKEN;
  if (!REQUIRE) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/api/')) return NextResponse.next();
  if (pathname === '/api/health') return NextResponse.next();

  if (!TOKEN) {
    return NextResponse.json({ ok: false, error: 'Server missing INTERNAL_API_TOKEN' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${TOKEN}`;
  if (auth !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};