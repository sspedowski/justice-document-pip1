import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: process.env.APP_SERVICE_NAME ?? 'justice-dashboard-main',
    at: new Date().toISOString(),
  });
}
