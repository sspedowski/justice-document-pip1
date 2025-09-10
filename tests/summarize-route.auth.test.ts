import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';

// Minimal NextResponse stub for tests
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({ status: init?.status ?? 200, json: async () => body }),
  },
}));

// Mock firebase admin to avoid env-dependent initialization at import time
vi.mock(new URL('../lib/firebaseAdmin.ts', import.meta.url).pathname, () => ({
  verifyIdToken: vi.fn(async () => ({ uid: 'test-user' })),
  verifyAppCheck: vi.fn(async () => true),
  db: { collection: () => ({ add: async () => {} }) },
}));

// Route under test (imported after mocks)
const { POST } = await import('../app/api/ai/summarize/route');

function makeReq(body: any, headers: Record<string, string> = {}) {
  return {
    json: async () => body,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  } as any;
}

describe('summarize auth (opt-in gate)', () => {
  const OLD = { ...process.env };

  beforeAll(() => {
    process.env = { ...OLD, REQUIRE_AUTH: '1', INTERNAL_API_TOKEN: 'secret', NODE_ENV: 'test' };
  });
  afterAll(() => { process.env = OLD; });

  it('401 when Authorization header is missing', async () => {
    const res: any = await POST(makeReq({ text: 'hello' }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('401 when token is invalid', async () => {
    const res: any = await POST(makeReq({ text: 'hello' }, { authorization: 'Bearer nope' }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('passes auth when token matches and proceeds to route logic', async () => {
    // With no GOOGLE_API_KEY set in tests, route likely returns 500 after auth.
    const res: any = await POST(makeReq({ text: 'hello' }, { authorization: 'Bearer secret' }));
    expect([400, 500, 200]).toContain(res.status);
  });
});

