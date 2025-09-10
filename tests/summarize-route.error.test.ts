import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock next/server with only what we use
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: any, init?: { status?: number }) => ({ status: init?.status ?? 200, body }),
    },
  };
});

// Mock firebase admin bindings to avoid env-dependent initialization
vi.mock(new URL('../lib/firebaseAdmin.ts', import.meta.url).pathname, () => {
  return {
    verifyIdToken: vi.fn(async () => ({ uid: 'test-user' })),
    verifyAppCheck: vi.fn(async () => true),
    db: { collection: () => ({ add: async () => {} }) },
  };
});

// Ensure we are not in production for these tests
beforeAll(() => {
  process.env.NODE_ENV = 'test';
});

// Import after mocks so route picks them up
const { POST } = await import('../app/api/ai/summarize/route');

function makeReq(body: any, headers: Record<string, string> = {}) {
  return {
    json: async () => body,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  } as any;
}

describe('summarize route error handling', () => {
  it('returns 400 when text is missing', async () => {
    const res: any = await POST(makeReq({}));
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'Missing text' });
  });

  it('returns 400 when text exceeds 20000 chars', async () => {
    const big = 'x'.repeat(20001);
    const res: any = await POST(makeReq({ text: big }));
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: 'Invalid size' });
  });

  it('returns 500 when GOOGLE_API_KEY is not set', async () => {
    delete process.env.GOOGLE_API_KEY;
    const res: any = await POST(makeReq({ text: 'hello world' }));
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: 'GOOGLE_API_KEY not configured' });
  });
});
