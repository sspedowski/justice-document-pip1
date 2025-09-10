import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { middleware } from '../middleware';

// Tiny helper to call the middleware without spinning up Next
const call = (pathname: string, auth?: string) =>
  middleware({
    nextUrl: { pathname } as any,
    headers: new Headers(auth ? { authorization: auth } : {}),
  } as any) as Response;

const OLD_ENV = process.env;

describe('middleware auth gate', () => {
  beforeAll(() => {
    // Enable the gate and set a token that tests can use
    process.env = { ...OLD_ENV, REQUIRE_AUTH: '1', INTERNAL_API_TOKEN: 'secret-token' } as NodeJS.ProcessEnv;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('allows /api/health without auth', () => {
    const res = call('/api/health');
    expect(res.status).toBe(200);
  });

  it('returns 401 when Authorization header is missing', () => {
    const res = call('/api/upload');
    expect(res.status).toBe(401);
    expect(res.headers.get('content-type') || '').toMatch(/application\/json/);
  });

  it('returns 401 when token is invalid', () => {
    const res = call('/api/summarize', 'Bearer nope');
    expect(res.status).toBe(401);
  });

  it('passes with valid token', () => {
    const res = call('/api/upload', 'Bearer secret-token');
    expect(res.status).toBe(200);
  });
});

