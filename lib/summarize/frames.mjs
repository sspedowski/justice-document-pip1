// Lightweight shared frames generator for streaming summarize route
// Kept framework-neutral so Node core tests can import without pulling Next.js.

/** @typedef {'queued'|'fetching'|'chunking'|'summarizing'|'result'|'end'} Stage */

export const MAX_LEN = 4000;

/**
 * @typedef {{ stage: Exclude<Stage,'result'|'end'>; progress?: number }} ProgressFrame
 * @typedef {{ stage: 'result'; result: string }} ResultFrame
 * @typedef {{ stage: 'end'; ok: true }} EndFrame
 * @typedef {(ProgressFrame|ResultFrame|EndFrame)} Frame
 */

/**
 * Produce the deterministic sequence of frames for a given text.
 * Throws for empty or too-long input mirroring the route's validation.
 * @param {string} text
 * @returns {Generator<Frame>}
 */
export function *framesForText(text) {
  if (!text || text.length > MAX_LEN) throw new Error('bad input');
  yield { stage: 'queued' }; yield { stage: 'fetching', progress: 10 }; yield { stage: 'chunking', progress: 35 }; yield { stage: 'summarizing', progress: 70 };
  yield { stage: 'result', result: `Summary (${Math.min(text.length, 140)} chars): ${text.slice(0,140)}${text.length>140?'…':''}` };
  yield { stage: 'end', ok: true };
}

/** Serialize a frame to an SSE data line (without buffering concerns). */
export const encodeFrame = f => `data: ${JSON.stringify(f)}\n\n`;
