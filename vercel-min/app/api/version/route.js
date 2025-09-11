import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: 'justice-dashboard-min',
    version: '0.1.0',
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    at: new Date().toISOString()
  });
}
