import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

jest.mock('file-type', () => ({ fileTypeFromBuffer: jest.fn(async () => ({ mime: 'application/pdf' })) }));
jest.mock('@vercel/blob', () => ({ put: jest.fn(async () => ({ url: 'https://blob.example/x' })) }), { virtual: true });
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow() { return {}; }
    constructor() {}
    async limit() { return { success: false, limit: 20, remaining: 0, reset: Math.ceil(Date.now()/1000)+30 }; }
  }
}));
jest.mock('@upstash/redis', () => ({ Redis: { fromEnv: () => ({}) } }));

describe('upload rate limit', () => {
  const OLD = process.env as NodeJS.ProcessEnv;
  beforeAll(() => {
    process.env = { ...OLD, RATE_LIMIT: '1', UPSTASH_REDIS_REST_URL: 'x', UPSTASH_REDIS_REST_TOKEN: 'y' } as NodeJS.ProcessEnv;
    jest.resetModules();
  });
  afterAll(() => { process.env = OLD; });

  it('returns 429 when limiter denies', async () => {
    const mod: any = await import('../app/api/upload/route');
    const req = new Request('http://localhost/api/upload', { method: 'POST', headers: { 'content-type': 'multipart/form-data; boundary=abc' }, body: '--abc--' } as any);
    const res: any = await mod.POST(req);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toMatch(/Too Many Requests/i);
  });
});
