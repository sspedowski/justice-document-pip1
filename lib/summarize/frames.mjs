// Framework-neutral async frame generator used by the streaming summarize route
// and imported directly in Node core tests (no Next.js dependency path).

import { summarizeViaClaude } from './provider.claude.mjs';

/**
 * Async generator yielding a deterministic staged lifecycle plus a synthetic summary.
 * @param {Object} opts
 * @param {string} [opts.text]
 * @param {number} [opts.delayMs] Delay between frames (0 in tests for speed)
 */
export async function* summarizeFrames({ text = '', delayMs = 60 } = {}) {
  if (typeof text !== 'string') text = String(text ?? '');

  yield { stage: 'start' };

  // If Claude API key is present, use Claude provider
  if (process.env.CLAUDE_API_KEY) {
    yield { stage: 'provider', name: 'claude' };
    try {
      const result = await summarizeViaClaude(text || '');
      yield {
        stage: 'done',
        ok: true,
        summary: result.summary,
        tags: result.tags,
        provider: result.provider,
        model: result.model
      };
      return;
    } catch (error) {
      yield {
        stage: 'done',
        ok: false,
        error: error.message || 'Claude summarization failed'
      };
      return;
    }
  }

  // Fallback to existing mock summarizer
  const steps = [
    { stage: 'queued', progress: 0 },
    { stage: 'fetching', progress: 10 },
    { stage: 'chunking', progress: 35 },
    { stage: 'summarizing', progress: 70 },
  ];

  for (const f of steps) {
    yield f;
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
  }

  const result = text ? `Summary of: ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}` : 'Summary (sample)';
  yield { stage: 'result', result };
  if (delayMs) await new Promise(r => setTimeout(r, delayMs));
  yield { stage: 'end', ok: true };
}

export function frameToSSE(frame) {
  return `data: ${JSON.stringify(frame)}\n\n`;
}
