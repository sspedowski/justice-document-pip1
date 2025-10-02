import test from 'node:test';
import assert from 'node:assert/strict';

// We import the POST handler directly (Next.js route). We only exercise the Accept gating logic.
import { POST, GET } from '../app/api/summarize/route.ts';

async function readAll(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value).toString('utf8'));
  }
  return chunks.join('');
}

test('POST /api/summarize returns 406 JSON when Accept header missing', async () => {
  const req = new Request('http://localhost/api/summarize', { method: 'POST', body: JSON.stringify({ text: 'hi' }) });
  const res = await POST(req);
  assert.equal(res.status, 406);
  const body = await res.text();
  const parsed = JSON.parse(body);
  assert.equal(parsed.error, 'NOT_ACCEPTABLE');
});

test('POST /api/summarize streams when Accept header present', async () => {
  const req = new Request('http://localhost/api/summarize', { method: 'POST', headers: { Accept: 'text/event-stream', 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'hi there' }) });
  const res = await POST(req);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /text\/event-stream/);
  assert.ok(res.body, 'expected body stream');
  // Read first frame only
  const reader = res.body.getReader();
  const first = await reader.read();
  assert.ok(!first.done, 'expected at least one frame');
  const text = new TextDecoder().decode(first.value);
  assert.match(text, /data: /);
  reader.cancel();
});

test('GET /api/summarize gating works (406)', async () => {
  const req = new Request('http://localhost/api/summarize', { method: 'GET' });
  const res = await GET(req);
  assert.equal(res.status, 406);
});

test('GET /api/summarize streams with Accept header', async () => {
  const req = new Request('http://localhost/api/summarize', { method: 'GET', headers: { Accept: 'text/event-stream' } });
  const res = await GET(req);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /text\/event-stream/);
  const reader = res.body.getReader();
  const first = await reader.read();
  assert.ok(!first.done);
  reader.cancel();
});
