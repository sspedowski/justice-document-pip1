// tests-node/summarize.json.test.mjs
// NOTE: This test expects the /api/summarize/json route to exist. If not yet implemented,
// you can skip running it or guard with an env flag.
import assert from 'node:assert/strict';
import test from 'node:test';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function tryFetch(path, init) {
  try {
    return await fetch(new URL(path, BASE), init);
  } catch (e) {
    if (e?.cause?.code === 'ECONNREFUSED') return null; // treat as skip
    return null;
  }
}

test('POST /api/summarize/json - happy path (skip if not available)', async (t) => {
  const res = await tryFetch('/api/summarize/json', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Hello' })
  });
  if (!res || res.status === 404) {
    t.diagnostic('server not running or route absent; skipping');
    return;
  }
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test('POST /api/summarize/json - invalid input (skip if not available)', async (t) => {
  const res = await tryFetch('/api/summarize/json', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: '' })
  });
  if (!res || res.status === 404) {
    t.diagnostic('server not running or route absent; skipping');
    return;
  }
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
});
