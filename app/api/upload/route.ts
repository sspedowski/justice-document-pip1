import { NextResponse, type NextRequest } from 'next/server';
import Busboy from 'busboy';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';
export const preferredRegion = ['iad1'];

export async function POST(request: NextRequest) {
  if (!request.body) {
    return NextResponse.json({ ok: false, error: 'Empty body' }, { status: 400 });
  }

  // Cast to any to satisfy Node's Readable.fromWeb type expectations in TS.
  // NextRequest.body is a web ReadableStream; Node's types can mismatch in some setups.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeStream = (Readable as any).fromWeb(request.body as any);
  const bb = Busboy({ headers: Object.fromEntries(request.headers) });

  const files: Array<{
    fieldname: string;
    filename: string;
    mimeType: string;
    size: number;
    sha256: string;
  }> = [];
  const fields: Record<string, string> = {};

  return new Promise<Response>((resolve, reject) => {
    bb.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;
      let size = 0;
      const hash = createHash('sha256');
      file.on('data', (chunk: Buffer) => { size += chunk.length; hash.update(chunk); });
      file.on('end', () => {
        files.push({ fieldname, filename, mimeType, size, sha256: hash.digest('hex') });
      });
    });

    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('error', (err) => reject(err));
    bb.on('close', () => {
      resolve(NextResponse.json({
        ok: true,
        count: files.length,
        files,
        fields,
        service: process.env.APP_SERVICE_NAME ?? 'justice-dashboard-main',
        at: new Date().toISOString(),
      }));
    });

  nodeStream.on('error', (err: unknown) => reject(err));
    nodeStream.pipe(bb);
  });
}
