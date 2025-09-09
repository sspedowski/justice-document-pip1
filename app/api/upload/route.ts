import { NextRequest, NextResponse } from 'next/server';
import Busboy from 'busboy';
import crypto from 'node:crypto';
import { extname } from 'node:path';
import { v4 as uuid } from 'uuid';
import { bucket, db, verifyIdToken, verifyAppCheck } from '../../../lib/firebaseAdmin';
import { checkLimit } from '../../../lib/rateLimiter';
import { getSignedUrl } from '../../../lib/signedUrl';
import { extractPdfTextToStorage } from '../../../lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOW = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp',
  'text/plain'
]);
const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES || 10 * 1024 * 1024);

function dateFolder(d = new Date()) { return d.toISOString().slice(0,10); }

export async function POST(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';

  let uid: string | null = null;
  if (isProd) {
    const idToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
    const appCheck = req.headers.get('x-firebase-appcheck') || undefined;
    try {
      const decoded = await verifyIdToken(idToken);
      await verifyAppCheck(appCheck);
      uid = decoded.uid;
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Unauthorized' }, { status: 401 });
    }
  }

  const key = uid ? `u:${uid}` : `ip:${ip}`;
  const { allowed, remaining, reset } = await checkLimit(key);
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded', remaining, reset }, { status: 429 });

  if (!req.headers.get('content-type')?.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Use multipart/form-data' }, { status: 400 });
  }

  const ts = new Date().toISOString();
  const fields: Record<string,string> = {};
  const uploaded: any[] = [];

  const bb = Busboy({
    headers: Object.fromEntries(req.headers as any),
    limits: { fileSize: MAX_BYTES, files: 5, fields: 10 },
  });

  const done = new Promise<void>((resolve, reject) => {
    bb.on('field', (name: string, val: string) => { if (typeof val === 'string' && val.length <= 2048) fields[name] = val; });
    bb.on('file', (fieldname: string, file: any, info: { filename: string; mimeType: string }) => {
      const { filename, mimeType } = info;
      if (!ALLOW.has(mimeType)) { file.resume(); return bb.emit('error', new Error(`mime not allowed: ${mimeType}`)); }
      const id = uuid();
      const ext = extname(filename || '') || '';
      const folder = dateFolder();
      const storagePath = `uploads/${folder}/${id}${ext}`;
      const hash = crypto.createHash('sha256');
      let size = 0;
      const dest = bucket.file(storagePath).createWriteStream({ metadata: { contentType: mimeType }, resumable: false });
      file.on('data', (chunk: Buffer) => { size += chunk.length; hash.update(chunk); });
      file.on('limit', () => { dest.end(); return reject(Object.assign(new Error('File too large'), { status: 413 })); });
      file.on('error', reject);
      dest.on('error', reject);
      dest.on('finish', async () => {
        const sha256 = hash.digest('hex');
        const docId = id;
        await db.collection('uploads').doc(docId).set({
          uid: uid ?? null,
          ip: isProd ? null : ip,
            ts,
          fieldname,
          filename,
          mimeType,
          size,
          sha256,
          storagePath,
          meta: fields,
          env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'dev',
        });
        let textExtract: any = null;
        if (mimeType === 'application/pdf') {
          try { textExtract = await extractPdfTextToStorage(storagePath); } catch {}
        }
        let signedUrl: string | undefined;
        try { signedUrl = await getSignedUrl(storagePath, 30); } catch {}
        uploaded.push({ fieldname, filename, mimeType, size, sha256, storagePath, signedUrl, textExtract });
      });
      file.pipe(dest);
    });
    bb.on('error', reject);
    bb.on('finish', () => resolve());
  });

  const body = req.body;
  if (!body) return NextResponse.json({ error: 'Empty body' }, { status: 400 });

  // Adapt web ReadableStream to Busboy (node expects Buffer chunks)
  // @ts-ignore
  body.pipeThrough(new TransformStream()).readable.pipeTo(new WritableStream({
    write(chunk) { bb.write(chunk); },
    close() { bb.end(); }
  }));

  try { await done; }
  catch (e: any) {
    const msg = e?.message || 'Upload failed';
    const code = /mime not allowed|file too large/i.test(msg) ? 400 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }

  return NextResponse.json({
    ok: true,
    service: 'justice-dashboard',
    ts,
    count: uploaded.length,
    files: uploaded,
    fields,
    rate: { remaining, reset },
  });
}
