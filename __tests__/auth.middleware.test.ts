import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { middleware } from '../middleware';

const OLD_ENV = process.env;

const call = (pathname: string, auth?: string) =>
  middleware({
    nextUrl: { pathname } as any,
    headers: new Headers(auth ? { authorization: auth } : {}),
  } as any);

describe('middleware auth', () => {
  beforeAll(() => {
    process.env = { ...OLD_ENV, REQUIRE_AUTH: '1', INTERNAL_API_TOKEN: 'secret' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('allows /api/health without auth', () => {
    const res: any = call('/api/health');
    expect(res.status).toBe(200);
  });

  it('401 when Authorization header is missing', () => {
    const res: any = call('/api/upload');
    expect(res.status).toBe(401);
    expect(res.headers.get('content-type') || '').toMatch(/application\/json/);
  });

  it('401 when token is invalid', () => {
    const res: any = call('/api/summarize', 'Bearer nope');
    expect(res.status).toBe(401);
  });

  it('passes with valid token', () => {
    const res: any = call('/api/upload', 'Bearer secret');
    expect(res.status).toBe(200);
  });
});