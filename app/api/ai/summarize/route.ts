import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyIdToken, verifyAppCheck, db } from '../../../../lib/firebaseAdmin';
import { redact } from '../../../../lib/redact';
import { sha256Hex } from '../../../../lib/hash';

interface BodyInput {
  text?: string;
  docId?: string;
  extra?: Record<string, unknown>;
}

export const runtime = 'nodejs';

function isProd() {
  return process.env.NODE_ENV === 'production';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BodyInput;
    const { text = '', docId } = body;

    if (!text.trim()) {
      return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 });
    }

    let uid: string | undefined;
    if (isProd()) {
      const authHeader = req.headers.get('authorization') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!token) {
        return new Response(JSON.stringify({ error: 'Missing auth token' }), { status: 401 });
      }
      try {
        const decoded = await verifyIdToken(token);
        uid = decoded.uid;
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid auth token' }), { status: 401 });
      }
      const appCheckToken = req.headers.get('x-firebase-appcheck') || undefined;
      const appCheckOk = await verifyAppCheck(appCheckToken);
      if (!appCheckOk) {
        return new Response(JSON.stringify({ error: 'Invalid App Check token' }), { status: 401 });
      }
    }

    const { redacted, summary } = redact(text);

    if (!process.env.GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'GOOGLE_API_KEY not configured' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const resp = await model.generateContent([{ text: redacted }]);
    const outputText = resp.response.text();
    const tokensUsed = resp.response.usageMetadata?.totalTokens ?? null;

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

    return new Response(
      JSON.stringify({ outputText, tokensUsed, model: modelName }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    console.error('AI summarize error', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
