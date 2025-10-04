// Framework-neutral async frame generator used by the streaming summarize route
// and imported directly in Node core tests (no Next.js dependency path).

import { randomUUID } from 'node:crypto';
import { summarizeViaClaude } from './provider.claude.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createRequestId() {
  try {
    if (typeof randomUUID === 'function') {
      return randomUUID();
    }
  } catch {
    // ignore and fall through to fallback below
  }
  return Math.random().toString(36).slice(2);
}

export async function* summarizeFrames({ text = '', delayMs = 60 } = {}) {
  const requestId = createRequestId();
  const started = Date.now();
  const wait = typeof delayMs === 'number' && delayMs > 0 ? () => sleep(delayMs) : () => Promise.resolve();
  const normalizedText = typeof text === 'string' ? text : String(text ?? '');
  const withMeta = (frame) => ({ ...frame, requestId, elapsedMs: Date.now() - started });

  yield withMeta({ stage: 'progress', phase: 'queued', message: 'queued', pct: 0 });
  await wait();

  if (process.env.CLAUDE_API_KEY) {
    yield withMeta({ stage: 'progress', phase: 'fetching', message: 'contacting claude', pct: 5 });
    await wait();
    try {
      const result = await summarizeViaClaude(normalizedText);
      yield withMeta({
        stage: 'result',
        ok: true,
        summary: result.summary,
        tags: result.tags ?? [],
        provider: result.provider,
        model: result.model,
      });
      yield withMeta({ stage: 'end', ok: true });
      return;
    } catch (error) {
      yield withMeta({
        stage: 'result',
        ok: false,
        error: error instanceof Error ? error.message : 'Claude summarization failed',
        provider: 'claude',
        model: process.env.CLAUDE_MODEL || undefined,
      });
      yield withMeta({ stage: 'end', ok: false });
      return;
    }
  }

  const steps = [
    { phase: 'fetching', message: 'fetching context', pct: 10 },
    { phase: 'chunking', message: 'chunking text', pct: 35 },
    { phase: 'summarizing', message: 'summarizing', pct: 70 },
  ];

  for (const step of steps) {
    yield withMeta({ stage: 'progress', ...step });
    await wait();
  }

  const summary = normalizedText
    ? `Summary of: ${normalizedText.slice(0, 120)}${normalizedText.length > 120 ? '...' : ''}`
    : 'Summary (sample)';

  yield withMeta({
    stage: 'result',
    ok: true,
    summary,
    tags: ['mock'],
    provider: 'mock',
    model: 'mock-local',
  });
  yield withMeta({ stage: 'end', ok: true });
}

export function frameToSSE(frame) {
  return `data: ${JSON.stringify(frame)}\n\n`;
}
