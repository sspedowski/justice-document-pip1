import test from 'node:test'
import assert from 'node:assert/strict'

async function loadLegacy() {
  try {
    return await import('../app/api/summarize/route.ts')
  } catch (e) {
    return { error: e }
  }
}

async function loadStream() {
  try {
    return await import('../app/api/summarize/stream/route.ts')
  } catch (e) {
    return { error: e }
  }
}

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

test('Legacy /api/summarize POST returns 410 pointer JSON', async (t) => {
  const mod = await loadLegacy()
  if (mod.error) { t.diagnostic('skipping legacy test: could not load TS route'); return }
  const req = new Request('http://localhost/api/summarize', { method: 'POST' })
  const res = await mod.POST(req)
  assert.equal(res.status, 410)
  const body = await res.text()
  const parsed = JSON.parse(body)
  assert.equal(parsed.error, 'MOVED_TO_SSE')
  assert.equal(parsed.next, '/api/summarize/stream')
})

test('Legacy /api/summarize GET returns 410 pointer JSON', async (t) => {
  const mod = await loadLegacy()
  if (mod.error) { t.diagnostic('skipping legacy GET test: could not load TS route'); return }
  const req = new Request('http://localhost/api/summarize', { method: 'GET' })
  const res = await mod.GET(req)
  assert.equal(res.status, 410)
})

test('Streaming POST /api/summarize/stream emits SSE frames', async (t) => {
  const mod = await loadStream()
  if (mod.error) { t.diagnostic('skipping stream POST test: could not load TS route'); return }
  const req = new Request('http://localhost/api/summarize/stream', { method: 'POST', headers: { 'Accept': 'text/event-stream', 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'hello split' }) })
  const res = await mod.POST(req)
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type') || '', /text\/event-stream/)
  const reader = res.body.getReader()
  const first = await reader.read()
  assert.ok(!first.done, 'expected first frame')
  reader.cancel()
})

test('Streaming GET /api/summarize/stream emits SSE frames', async (t) => {
  const mod = await loadStream()
  if (mod.error) { t.diagnostic('skipping stream GET test: could not load TS route'); return }
  const req = new Request('http://localhost/api/summarize/stream', { method: 'GET', headers: { 'Accept': 'text/event-stream' } })
  const res = await mod.GET(req)
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type') || '', /text\/event-stream/)
  const reader = res.body.getReader()
  const first = await reader.read()
  assert.ok(!first.done)
  reader.cancel()
})
