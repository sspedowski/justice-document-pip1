import test from 'node:test';
import assert from 'node:assert/strict';

// Assumes dev server or test harness running on :3020 (adjust if different)
const BASE = process.env.TEST_BASE || 'http://localhost:3020';

async function postJson(text) {
  const res = await fetch(`${BASE}/api/summarize/json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return res;
}

test('json summarizer returns ok + shape', async () => {
  const res = await postJson('Hello from JSON path');
  assert.equal(res.ok, true, 'response not ok');
  const ct = res.headers.get('content-type') || '';
  assert.match(ct, /application\/json/, 'content-type not json');
  const data = await res.json();
  assert.equal(data.ok, true, 'data.ok false');
  assert.ok(typeof data.summary === 'string');
  assert.ok(Array.isArray(data.tags));
});
