import { NextResponse } from 'next/server';
import Busboy from 'busboy';
import { bucket } from '@/lib/firebaseAdmin';
import crypto from 'crypto';
import { extname } from 'path';
import mime from 'mime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BYTES = parseInt(process.env.UPLOAD_MAX_BYTES || '10485760', 10); // 10MB default
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/plain',
]);

function uid(id = crypto.randomUUID()) {
  return id.replace(/-/g, '');
}

export async function POST(req: Request) {
  const ctype = req.headers.get('content-type') || '';
  if (!ctype.toLowerCase().includes('multipart/form-data')) {
    return NextResponse.json({ ok: false, error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const ts = new Date().toISOString();
  const fields: Record<string,string> = {};
  const filesMeta: any[] = [];

  try {
    const bb = Busboy({ headers: Object.fromEntries(req.headers) as any, limits: { fileSize: MAX_BYTES } });

    const finished = new Promise<void>((resolve, reject) => {
      bb.on('field', (name, val) => { fields[name] = val; });

      bb.on('file', (fieldname, file, info) => {
        const { filename, mimeType } = info;
        if (!ALLOWED_MIME.has(mimeType)) {
          file.resume();
            return reject(Object.assign(new Error('Unsupported file type'), { status: 415 }));
        }
        const base = filename?.trim() || 'upload';
        const safeExt = extname(base) || `.${(mime.getExtension(mimeType) || 'bin').replace(/[^a-z0-9]/gi,'')}`;
        const storagePath = `uploads/${ts.slice(0,10)}/${uid()}${safeExt}`;
        const hash = crypto.createHash('sha256');
        let bytes = 0;

        const gcsStream = bucket.file(storagePath).createWriteStream({ metadata: { contentType: mimeType }, resumable: false });

        file.on('data', (chunk: Buffer) => { bytes += chunk.length; hash.update(chunk); });
        file.on('limit', () => {
          file.unpipe(gcsStream);
          gcsStream.end();
          reject(Object.assign(new Error('File too large'), { status: 413 }));
        });
        file.on('error', (e) => reject(e));
        gcsStream.on('error', (e) => reject(e));

        gcsStream.on('finish', () => {
          const sha256 = hash.digest('hex');
          filesMeta.push({ fieldname, filename: base, mimeType, size: bytes, sha256, storagePath });
        });

        file.pipe(gcsStream);
      });

      bb.once('error', reject);
      bb.once('finish', () => resolve());
    });

    // Stream request body chunks to busboy
    (async () => {
      const reader = req.body?.getReader();
      if (!reader) { bb.end(); return; }
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) bb.write(Buffer.from(value));
      }
      bb.end();
    })().catch(e => bb.emit('error', e));

    await finished;

    return NextResponse.json({ ok: true, service: 'justice-dashboard', ts, count: filesMeta.length, files: filesMeta, fields });
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return NextResponse.json({ ok: false, error: err?.message || 'Upload error' }, { status });
  }
}
