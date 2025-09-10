import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn(async () => ({ mime: 'application/pdf' })) }));
jest.mock('@vercel/blob', () => ({ put: jest.fn(async () => ({ url: 'https://blob.example/x' })) }), { virtual: true });
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(async () => 1), // already seen
    set: jest.fn(async () => undefined),
  }
}));

describe('upload KV dedupe', () => {
  const OLD = process.env as NodeJS.ProcessEnv;
  beforeAll(() => {
    process.env = { ...OLD, KV_REST_API_URL: 'x', KV_REST_API_TOKEN: 'y' } as NodeJS.ProcessEnv;
    jest.resetModules();
  });
  afterAll(() => { process.env = OLD; });

  it('marks KV duplicate in reasons', async () => {
    const mod: any = await import('../app/api/upload/route');
    const body = new FormData();
    body.append('doc', new Blob(['%PDF-1.4\n%']), 'a.pdf');
    const req = new Request('http://localhost/api/upload', { method: 'POST', body });
    const res: any = await mod.POST(req);
    const json = await res.json();
    const f = json.files?.[0];
    expect(f.isDuplicate).toBe(true);
    expect((f.reasons || []).join(' ')).toMatch(/kv/i);
  });
});
