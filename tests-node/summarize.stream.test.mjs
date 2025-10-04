import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeFrames } from '../lib/summarize/frames.mjs';

test('emits canonical progress/result/end frames with metadata', async () => {
  const frames = [];
  for await (const frame of summarizeFrames({ text: 'hello world', delayMs: 0 })) {
    frames.push(frame);
  }

  assert.ok(frames.length >= 2, 'expected at least progress and end frames');
  assert.equal(frames[0].stage, 'progress');
  assert.equal(frames.at(-2).stage, 'result');
  assert.equal(frames.at(-1).stage, 'end');

  const requestIds = new Set(frames.map((f) => f.requestId));
  assert.equal(requestIds.size, 1, 'all frames share the same requestId');

  const resultFrame = frames.at(-2);
  assert.equal(resultFrame.ok, true, 'fallback pipeline should succeed');
  assert.equal(typeof resultFrame.summary, 'string');
  assert.ok(Array.isArray(resultFrame.tags));

  const endFrame = frames.at(-1);
  assert.equal(endFrame.ok, true);
});
