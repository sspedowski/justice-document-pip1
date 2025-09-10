import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { POST } from '../app/api/upload/route';

const OLD_ENV = process.env;
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ensureWebAPIs() {
  if (!globalThis.FormData || !globalThis.Blob) {
    // @ts-ignore
    const undici = require('undici');
    // @ts-ignore
    globalThis.FormData = undici.FormData;
    // @ts-ignore
    globalThis.Blob = undici.Blob;
    // @ts-ignore
    globalThis.File = undici.File;
  }
}

beforeAll(() => {
  process.env = { ...OLD_ENV, UPLOAD_ALLOWED_MIME: 'application/pdf' } as NodeJS.ProcessEnv;
  jest.resetModules();
  ensureWebAPIs();
});

afterAll(() => {
  process.env = OLD_ENV;
});

function makeReq(
  fields: Record<string, string>,
  files: Array<{ name: string; filename: string; contentType: string; data: Buffer }>
) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  for (const f of files) {
    const blob = new Blob([f.data], { type: f.contentType });
    // @ts-ignore third arg provides filename
    fd.append(f.name, blob, f.filename);
  }
  return new Request('http://localhost/api/upload', { method: 'POST', body: fd });
}

describe('upload handler (direct POST invocation)', () => {
  it('returns docId for single file', async () => {
    const req = makeReq(
      { note: 'trial' },
      [{ name: 'doc', filename: 'a.pdf', contentType: 'application/pdf', data: Buffer.from('%PDF-1.4\n%') }]
    );
    const res: any = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.count).toBe(1);
    const f = json.files[0];
    expect(uuidRe.test(f.docId)).toBe(true);
    expect(f.accepted).toBe(true);
    expect(json.fields).toEqual({ note: 'trial' });
  });

  it('returns unique docIds for multiple files', async () => {
    const req = makeReq({}, [
      { name: 'doc', filename: 'one.pdf', contentType: 'application/pdf', data: Buffer.from('%PDF-1.4\none') },
      { name: 'doc', filename: 'two.pdf', contentType: 'application/pdf', data: Buffer.from('%PDF-1.4\ntwo') },
    ]);
    const res: any = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.count).toBe(2);
    const ids = json.files.map((f: any) => f.docId);
    expect(ids[0]).not.toBe(ids[1]);
    ids.forEach((id: string) => expect(uuidRe.test(id)).toBe(true));
  });
});