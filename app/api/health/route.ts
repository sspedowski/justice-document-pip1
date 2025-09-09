import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const hasGemini = !!process.env.GOOGLE_API_KEY;
  let hasServiceAccount = false;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      hasServiceAccount = !!(json.client_email && json.private_key);
    }
  } catch {
    hasServiceAccount = false;
  }
  return NextResponse.json({ ok: true, hasGemini, hasServiceAccount, ts: Date.now() });
}
