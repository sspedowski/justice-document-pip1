export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function GET() {
  const file = path.join(process.cwd(), 'public', 'dashboard', 'index.html');
  const html = await fs.readFile(file, 'utf8');
  return new NextResponse(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

