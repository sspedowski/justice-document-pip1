// Framework-neutral async frame generator used by the streaming summarize route
// and imported directly in Node core tests (no Next.js dependency path).

/**
 * Async generator yielding a deterministic staged lifecycle plus a synthetic summary.
 * @param {Object} opts
 * @param {string} [opts.text]
 * @param {number} [opts.delayMs] Delay between frames (0 in tests for speed)
 */
export async function* summarizeFrames({ text = '', delayMs = 60 } = {}) {
  if (typeof text !== 'string') text = String(text ?? '');

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
