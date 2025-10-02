import { NextResponse } from 'next/server';
import type { SummarizeJsonRequest, SummarizeJsonResponse } from '@/lib/types/summarize';

const STOP = new Set([
  'the','a','an','and','or','but','if','in','on','for','to','of','with',
  'is','are','was','were','be','been','being','as','at','by','from','that',
  'this','it','its','into','over','about','after','before','between','through'
]);

function summarizeHeuristic(text: string): { summary: string; tags: string[] } {
  const clean = text.trim().replace(/\s+/g, ' ');
  const summary = clean.length <= 220 ? clean : clean.slice(0, 217) + '…';
  const words = clean.toLowerCase().match(/[a-z0-9][a-z0-9\-]+/g) ?? [];
  const freq = new Map<string, number>();
  for (const w of words) {
    if (STOP.has(w) || w.length < 3) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const tags = [...freq.entries()].sort((a,b)=> b[1]-a[1]).slice(0,5).map(([w])=> w);
  return { summary, tags };
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const res: SummarizeJsonResponse = { ok: false, error: 'Invalid JSON body', requestId };
    return NextResponse.json(res, { status: 400 });
  }
  const input = body as Partial<SummarizeJsonRequest>;
  const text = typeof input.text === 'string' ? input.text : '';
  if (!text.trim()) {
    const res: SummarizeJsonResponse = { ok: false, error: '`text` is required', requestId };
    return NextResponse.json(res, { status: 400 });
  }
  if (text.length > 4000) {
    const res: SummarizeJsonResponse = { ok: false, error: '`text` must be ≤ 4000 characters', requestId };
    return NextResponse.json(res, { status: 400 });
  }
  const { summary, tags } = summarizeHeuristic(text);
  const elapsedMs = Date.now() - started;
  const res: SummarizeJsonResponse = {
    ok: true,
    summary,
    tags,
    provider: 'local',
    model: 'heuristic-v1',
    requestId,
    elapsedMs
  };
  return NextResponse.json(res, { status: 200 });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';