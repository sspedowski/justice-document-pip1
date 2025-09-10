import { NextRequest, NextResponse } from 'next/server';

/** Require auth if REQUIRE_AUTH=1 or NODE_ENV=production. */
export function requireAuth(req: NextRequest) {
  const shouldRequire =
    process.env.REQUIRE_AUTH === '1' || process.env.NODE_ENV === 'production';

  if (!shouldRequire) return null;

  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!token || token !== process.env.INTERNAL_API_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

