import { describe, it, expect, beforeEach, vi } from 'vitest';
import { staffToolbarEnabled, parseBoolish } from '@/utils/featureFlags.js';

describe('featureFlags', () => {
  beforeEach(() => {
    // reset jsdom localStorage
    localStorage.clear();
    delete window.NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED;
  });

  it('parseBoolish handles common values', () => {
    expect(parseBoolish('true')).toBe(true);
    expect(parseBoolish('1')).toBe(true);
    expect(parseBoolish('on')).toBe(true);
    expect(parseBoolish('false')).toBe(false);
    expect(parseBoolish('0')).toBe(false);
    expect(parseBoolish('off')).toBe(false);
    expect(parseBoolish('maybe')).toBeNull();
  });

  it('disabled by default when no env or overrides', () => {
    expect(staffToolbarEnabled({ env: {}, win: window })).toBe(false);
  });

  it('enabled via Vite env', () => {
    expect(staffToolbarEnabled({ env: { VITE_VERCEL_TOOLBAR_ENABLED: 'true' }, win: window })).toBe(true);
  });

  it('enabled via Next-style env on window', () => {
    window.NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED = 'true';
    expect(staffToolbarEnabled({ env: {}, win: window })).toBe(true);
  });

  it('localStorage override takes precedence to enable', () => {
    localStorage.setItem('staffToolbar', '1');
    expect(staffToolbarEnabled({ env: {}, win: window })).toBe(true);
  });

  it('localStorage override takes precedence to disable even if env says true', () => {
    localStorage.setItem('staffToolbar', '0');
    expect(staffToolbarEnabled({ env: { VITE_VERCEL_TOOLBAR_ENABLED: 'true' }, win: window })).toBe(false);
  });
});
