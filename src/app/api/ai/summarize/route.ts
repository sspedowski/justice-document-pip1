import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyIdToken, verifyAppCheck, db } from '../../../../../lib/firebaseAdmin';
import { redact } from '../../../../../lib/redact';
import { sha256Hex } from '../../../../../lib/hash';

interface BodyInput {
  text?: string;
  docId?: string;
  extra?: Record<string, unknown>;
}

export const runtime = 'nodejs';

const isProd = () => process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BodyInput;
    const { text = '', docId } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }
    if (text.length > 20000) {
      return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
    }

    let uid: string | undefined;
    if (isProd()) {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace(/^Bearer\s+/i, '') || '';
      if (!token) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
      try {
        const decoded = await verifyIdToken(token);
        uid = decoded.uid;
      } catch {
        return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
      }
      const appCheckToken = req.headers.get('x-firebase-appcheck') || undefined;
      const appCheckOk = await verifyAppCheck(appCheckToken);
      if (!appCheckOk) return NextResponse.json({ error: 'Invalid App Check token' }, { status: 401 });
    }

    const { redacted, summary } = redact(text);

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const resp = await model.generateContent([{ text: redacted }]);
    const outputText = resp.response.text();
  // Some versions expose different fields; serialize available numeric values.
  const usage: any = resp.response.usageMetadata || {};
  const tokensUsed = usage.totalTokens || usage.promptTokens || usage.candidatesTokens || null;

    // Firestore log (avoid raw text in production)
    try {
      const hashedDocId = sha256Hex(docId || text.slice(0, 256));
      await db.collection('ai_logs').add({
        uid: uid || null,
        ts: Date.now(),
        model: modelName,
        hashedDocId,
        redactionSummary: summary,
        promptChars: text.length,
        outputChars: outputText.length,
        env: process.env.NODE_ENV,
      });
    } catch (e) {
      console.error('Failed to log ai_logs:', e);
    }

  return NextResponse.json({ outputText, tokensUsed, model: modelName });
  } catch (e) {
    console.error('AI summarize error', e);
  return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
