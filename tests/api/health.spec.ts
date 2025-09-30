import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3021';

describe('API Health Check', () => {
  it('should return { ok: true } from /api/rtdb', async () => {
    const response = await fetch(`${BASE_URL}/api/rtdb`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });
});
