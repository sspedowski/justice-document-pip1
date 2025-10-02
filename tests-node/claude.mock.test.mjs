import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeWithClaude } from '../lib/ai/claudeClient.mjs';

test('claude client mock works without API key', async () => {
  delete process.env.CLAUDE_API_KEY;
  const out = await summarizeWithClaude('hello world');
  assert.ok(Array.isArray(out.summary_bullets));
  assert.match(out.summary_bullets[0], /Mock summary/);
});
