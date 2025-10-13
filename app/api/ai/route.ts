import { NextRequest, NextResponse } from 'next/server';
import { summarizeChunks } from '@/lib/ai/hierarchicalSummarizer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { mode, chunks } = await req.json();

    if (mode === 'digest') {
      const out = await summarizeChunks(
        Array.isArray(chunks) ? chunks : [],
      );
      return NextResponse.json({ ok: true, result: out });
    }

    return NextResponse.json({ ok: false, error: 'Unknown mode' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}
