import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeFrames } from '../lib/summarize/frames.mjs';

test('emits stages in order and ends cleanly', async () => {
  const seen = [];
  for await (const f of summarizeFrames({ text: 'hello world', delayMs: 0 })) {
    seen.push(f.stage);
  }
  assert.deepEqual(seen, ['queued','fetching','chunking','summarizing','result','end']);
});
