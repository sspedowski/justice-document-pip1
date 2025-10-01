import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeChunks } from '../lib/ai/hierarchicalSummarizer.js';

test('summarizeChunks returns title and body using inputs', async () => {
  const out = await summarizeChunks([{text:'a'}, {text:'b'}, {text:'c'}]);
  assert.equal(typeof out.title, 'string');
  assert.ok(out.title.length > 0);
  assert.match(out.body, /a|b|c/);
});
