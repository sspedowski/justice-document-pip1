import type { SSEFrame } from './summarize';

/**
 * Runtime type guard for SSEFrame - validates network data at stream boundary.
 * Prevents untrusted inputs from poisoning TypeScript types.
 */
export function isSSEFrame(u: unknown): u is SSEFrame {
  if (!u || typeof u !== 'object') return false;
  const frame = u as Record<string, unknown>;
  const stage = frame.stage;

  // Check that stage is one of the valid discriminant values
  return (
    stage === 'start' ||
    stage === 'queued' ||
    stage === 'provider' ||
    stage === 'progress' ||
    stage === 'result' ||
    stage === 'end' ||
    stage === 'done' ||
    stage === 'error'
  );
}
