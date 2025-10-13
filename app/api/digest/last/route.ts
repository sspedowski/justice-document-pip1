import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const path = resolve(process.cwd(), 'data', 'digest-latest.txt');
    const buf = await readFile(path);
    const text = buf.toString('utf8');
    return NextResponse.json({ ok: true, text });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Failed to read digest' },
      { status: 404 },
    );
  }
}
