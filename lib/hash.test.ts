import { describe, it, expect } from 'vitest';
import { sha256Hex } from './hash';

describe('sha256Hex', () => {
  it('produces stable hash', () => {
    const a = sha256Hex('hello');
    const b = sha256Hex('hello');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different hash for different input', () => {
    const a = sha256Hex('hello');
    const b = sha256Hex('hello ');
    expect(a).not.toBe(b);
  });
});
