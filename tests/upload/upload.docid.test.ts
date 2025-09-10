import { describe, it, expect, vi } from 'vitest';
import { Readable, Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import Busboy from 'busboy';
import { POST } from '../../app/api/upload/route';

// Mock firebase-admin usages to avoid real network/service account requirements
vi.mock('../../lib/firebaseAdmin', () => {
  return {
    bucket: { file: () => ({ createWriteStream: () => new Writable({ write(_chunk, _enc, cb){ cb(); } }) }) },
    db: { collection: () => ({ doc: () => ({ set: async () => {} }) }) },
    verifyIdToken: async () => ({ uid: 'test-user' }),
    verifyAppCheck: async () => true,
  };
});

// Mock rate limiter to always allow
vi.mock('../../lib/rateLimiter', () => ({ checkLimit: async () => ({ allowed: true, remaining: 10, reset: Date.now() + 60000 }) }));
// Mock signedUrl helper
vi.mock('../../lib/signedUrl', () => ({ getSignedUrl: async () => 'https://signed.example.com/file' }));
// Mock pdf extraction
vi.mock('../../lib/pdf', () => ({ extractPdfTextToStorage: async () => null }));

function uuidRegex() { return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i; }

async function makeMultipartRequest(files: Array<{ name: string; filename: string; contentType: string; content: Buffer }>, fields: Record<string,string> = {}) {
  const boundary = '----vitest-boundary-' + randomUUID();
  const parts: Buffer[] = [];
  for (const [k,v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  for (const f of files) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${f.name}"; filename="${f.filename}"\r\nContent-Type: ${f.contentType}\r\n\r\n`));
    parts.push(f.content);
    parts.push(Buffer.from('\r\n'));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(parts);
  const req = new Request('http://localhost/api/upload', {
    method: 'POST',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  const res = await POST(req as any);
  const json = await res.json();
  return { status: 200, body: json };
}

describe('upload docId integration', () => {
  it('returns docId for single file', async () => {
    const { body } = await makeMultipartRequest([
      { name: 'doc', filename: 'a.txt', contentType: 'text/plain', content: Buffer.from('example') }
    ]);
    expect(body.ok).toBe(true);
    expect(body.files.length).toBe(1);
    expect(body.files[0].docId).toMatch(uuidRegex());
  });

  it('returns unique docIds for multiple files', async () => {
    const { body } = await makeMultipartRequest([
      { name: 'doc', filename: 'one.txt', contentType: 'text/plain', content: Buffer.from('first') },
      { name: 'doc', filename: 'two.txt', contentType: 'text/plain', content: Buffer.from('second') }
    ]);
    const ids = body.files.map((f: any) => f.docId);
    expect(ids.length).toBe(2);
    expect(ids[0]).not.toBe(ids[1]);
    ids.forEach((id: string) => expect(id).toMatch(uuidRegex()));
  });
});
