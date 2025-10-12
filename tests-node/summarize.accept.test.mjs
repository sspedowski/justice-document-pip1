import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Legacy pointer route (returns 410)
import { POST as LEGACY_POST, GET as LEGACY_GET } from '../app/api/summarize/route';
// Streaming route
import { POST as STREAM_POST, GET as STREAM_GET } from '../app/api/summarize/stream/route';

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

test('Legacy /api/summarize POST returns 410 pointer JSON', async () => {
  const req = new Request('http://localhost/api/summarize', { method: 'POST' });
  const res = await LEGACY_POST(req);
  assert.equal(res.status, 410);
  const body = await res.text();
  const parsed = JSON.parse(body);
  assert.equal(parsed.error, 'MOVED_TO_SSE');
  assert.equal(parsed.next, '/api/summarize/stream');
});

test('Legacy /api/summarize GET returns 410 pointer JSON', async () => {
  const req = new Request('http://localhost/api/summarize', { method: 'GET' });
  const res = await LEGACY_GET(req);
  assert.equal(res.status, 410);
});

test('Streaming POST /api/summarize/stream emits SSE frames', async () => {
  const req = new Request('http://localhost/api/summarize/stream', { method: 'POST', headers: { 'Accept': 'text/event-stream', 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'hello split' }) });
  const res = await STREAM_POST(req);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /text\/event-stream/);
  const reader = res.body.getReader();
  const first = await reader.read();
  assert.ok(!first.done, 'expected first frame');
  reader.cancel();
});

test('Streaming GET /api/summarize/stream emits SSE frames', async () => {
  const req = new Request('http://localhost/api/summarize/stream', { method: 'GET', headers: { 'Accept': 'text/event-stream' } });
  const res = await STREAM_GET(req);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /text\/event-stream/);
  const reader = res.body.getReader();
  const first = await reader.read();
  assert.ok(!first.done);
  reader.cancel();
});

test('Sentinel: no legacy JSON summarize endpoint in repo', () => {
  // Ensures the old /api/summarize/json route and summarizeJson client don't creep back
  const forbiddenPaths = [
    'app/api/summarize/json',
    'src/lib/client/summarizeJson.ts',
    'lib/client/summarizeJson.ts'
  ];

  for (const path of forbiddenPaths) {
    const fullPath = join(process.cwd(), path);
    assert.ok(
      !existsSync(fullPath),
      `Forbidden legacy JSON endpoint found: ${path} (use SSE /api/summarize/stream instead)`
    );
  }
});
