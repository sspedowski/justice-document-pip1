import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'justice-dashboard-min',
    at: new Date().toISOString()
  });
}
