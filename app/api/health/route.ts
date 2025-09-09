import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json({
    ok: true,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'dev',
    checks: {
      googleApiKey: !!process.env.GOOGLE_API_KEY,
      serviceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      storageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
    },
  });
}
