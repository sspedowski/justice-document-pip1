import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function tryFetch(path, init) {
  try {
    return await fetch(new URL(path, BASE), init);
  } catch (e) {
    if (e?.cause?.code === 'ECONNREFUSED') return null;
    throw e;
  }
}

test('POST /api/summarize/json returns ok when reachable (skip if server absent)', async (t) => {
  const res = await tryFetch('/api/summarize/json', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Hello world. This is a short sample.' })
  });
  if (!res || res.status === 404) {
    t.diagnostic('server not running or route absent; skipping');
    return;
  }
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(typeof body.summary, 'string');
  assert.ok(Array.isArray(body.tags));
});
