import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getEnv } from '@/config/env';

export function middleware(req: NextRequest) {
  const { requireAuth, internalApiToken } = getEnv();
  if (!requireAuth) return NextResponse.next();

  // Allow health without auth
  if (req.nextUrl.pathname === '/api/health') return NextResponse.next();

  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token !== internalApiToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
