import test from 'node:test'
import assert from 'node:assert/strict'

const ORIG_ENV = { ...process.env }

test.afterEach(() => { process.env = { ...ORIG_ENV } })

test('__testBuildOptions builds expected option shape without undefined fields', async () => {
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'proj-123' })
  process.env.FIREBASE_PROJECT_ID = '' // ensure fallback to creds.project_id
  delete process.env.FIREBASE_DATABASE_URL // simulate absence
  process.env.FIREBASE_STORAGE_BUCKET = 'bucket-1'

  const mod: any = await import('../lib/firebaseAdmin.ts?t=' + Math.random())
  assert.ok(mod.__testBuildOptions, 'helper exported')
  const opts = mod.__testBuildOptions()
  assert.equal(opts.projectId, 'proj-123')
  assert.equal('databaseURL' in opts, true, 'inferred databaseURL present')
  assert.equal(opts.storageBucket, 'bucket-1')
  // ensure no stray undefined values recorded
  for (const [k, v] of Object.entries(opts)) {
    assert.notEqual(v, undefined, `option ${k} should not be undefined`)
  }
})
