import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyIdToken, verifyAppCheck } from '../../../../../lib/firebaseAdmin';
import { redact } from '../../../../../lib/redact';
import { sha256Hex } from '../../../../../lib/hash';

export const runtime = 'nodejs';

const isProd = () => process.env.NODE_ENV === 'production';

// Simple NDJSON streaming helper
function encoder() { return new TextEncoder(); }
function toNDJSON(obj: any) { return JSON.stringify(obj) + '\n'; }

export async function POST(req: NextRequest) {
  const enc = encoder();
  const { text = '', docId } = await req.json();

  if (!text || !text.trim()) {
    return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 });
  }
  if (text.length > 20000) {
    return new Response(JSON.stringify({ error: 'Invalid size' }), { status: 400 });
  }

  let uid: string | undefined;
  if (isProd()) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '') || '';
    if (!token) return new Response(JSON.stringify({ error: 'Missing auth token' }), { status: 401 });
    try { uid = (await verifyIdToken(token)).uid; } catch { return new Response(JSON.stringify({ error: 'Invalid auth token' }), { status: 401 }); }
    const appCheckToken = req.headers.get('x-firebase-appcheck') || undefined;
    const ok = await verifyAppCheck(appCheckToken);
    if (!ok) return new Response(JSON.stringify({ error: 'Invalid App Check token' }), { status: 401 });
  }

  if (!process.env.GOOGLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'GOOGLE_API_KEY not configured' }), { status: 500 });
  }

  const { redacted, summary } = redact(text);

  // We will do a single completion then stream chunks by splitting sentences (Gemini SDK
  // free tier here doesn't provide direct token stream in this simplified example).
  // For production true token streaming, swap to the SDK's streaming API when available.
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  const start = Date.now();
  let outputText = '';
  let usageTokens: number | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(enc.encode(toNDJSON({ type: 'start', ts: start })))
        const resp = await model.generateContent([{ text: redacted }]);
        outputText = resp.response.text();
        const usage: any = resp.response.usageMetadata || {};
        usageTokens = usage.totalTokens || usage.promptTokens || usage.candidatesTokens || null;
        const pieces = outputText.split(/(?<=[.!?])\s+/);
        for (const piece of pieces) {
          controller.enqueue(enc.encode(toNDJSON({ type: 'delta', text: piece })));
        }
        controller.enqueue(enc.encode(toNDJSON({ type: 'complete', tokensUsed: usageTokens })))
      } catch (e:any) {
        controller.enqueue(enc.encode(toNDJSON({ type: 'error', error: e?.message || 'error' })));
      } finally {
        controller.close();
      }
    }
  });

  // (Optional) logging identical to non-streaming route can be added externally after full output
  // by a middleware / queue if desired; or we can log here after generation.
  try {
    const hashedDocId = sha256Hex(docId || text.slice(0,256));
    // Fire-and-forget import to avoid blocking stream close
    import('../../../../../lib/firebaseAdmin').then(({ db }) => {
      db.collection('ai_logs').add({
        uid: uid || null,
        ts: Date.now(),
        model: modelName,
        hashedDocId,
        redactionSummary: summary,
        promptChars: text.length,
        outputChars: outputText.length,
        env: process.env.NODE_ENV,
        streaming: true
      }).catch(() => {});
    });
  } catch {}

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
