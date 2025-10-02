import test from 'node:test';
import assert from 'node:assert/strict';
import { framesForText } from '../lib/summarize/frames.mjs';

test('SSE frames sequence is well-formed', () => {
  const frames = [...framesForText('hello world')];
  const stages = frames.map(f => f.stage);
  assert.deepEqual(stages, ['queued','fetching','chunking','summarizing','result','end']);
  const result = frames.find(f => f.stage === 'result');
  assert.ok(result && typeof result.result === 'string' && result.result.length > 0);
  const end = frames.at(-1);
  assert.deepEqual(end, { stage: 'end', ok: true });
});

test('input validation enforced', () => {
  assert.throws(() => [...framesForText('')]);
});
