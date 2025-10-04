import type { SSEFrame } from './summarize';

/**
 * Runtime type guard for SSEFrame - validates network data at stream boundary.
 * Prevents untrusted inputs from poisoning TypeScript types.
 */
export function isSSEFrame(u: unknown): u is SSEFrame {
  if (!u || typeof u !== 'object') return false;
  const frame = u as Record<string, unknown>;
  const stage = frame.stage;

  if (stage === 'progress') {
    return true;
  }

  if (stage === 'result') {
    return typeof frame.ok === 'boolean';
  }

  if (stage === 'end') {
    return typeof frame.ok === 'boolean';
  }

  return false;
}
