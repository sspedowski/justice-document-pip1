import { NextResponse } from 'next/server';
import Busboy from 'busboy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // seconds (Vercel edge budget for Node fn)

interface UploadedFileMeta {
  fieldname: string;
  filename?: string;
  mimeType?: string;
  size: number;
}

async function parseMultipart(req: Request): Promise<{ files: UploadedFileMeta[]; fields: Record<string,string> } > {
  return new Promise((resolve, reject) => {
    const headers = Object.fromEntries(req.headers.entries());
    const bb = Busboy({ headers } as any);
    const files: UploadedFileMeta[] = [];
    const fields: Record<string,string> = {};

    bb.on('file', (name, file, info) => {
      const chunks: Buffer[] = [];
      file.on('data', (d: Buffer) => chunks.push(d));
      file.on('limit', () => reject(new Error('File size limit reached')));
      file.on('end', () => {
        const buffer = Buffer.concat(chunks);
        files.push({ fieldname: name, filename: info.filename, mimeType: info.mimeType, size: buffer.length });
        // NOTE: storage upload would stream 'file' rather than buffering entire file.
      });
    });

    bb.on('field', (name, val) => { fields[name] = val; });
    bb.once('error', reject);
    bb.once('finish', () => resolve({ files, fields }));

    (async () => {
      const reader = req.body?.getReader();
      if (!reader) { bb.end(); return; }
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) bb.write(Buffer.from(value));
      }
      bb.end();
    })().catch(reject);
  });
}

export async function POST(req: Request) {
  const ctype = req.headers.get('content-type') || '';
  if (!ctype.toLowerCase().includes('multipart/form-data')) {
    return NextResponse.json({ ok: false, error: 'Expected multipart/form-data' }, { status: 400 });
  }
  try {
    const { files, fields } = await parseMultipart(req);
    return NextResponse.json({ ok: true, count: files.length, files, fields });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Upload error' }, { status: 500 });
  }
}
