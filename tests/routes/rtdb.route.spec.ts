import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type EnvFlag = 'true' | 'false'

const envSnapshot = { ...process.env }

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in envSnapshot)) {
      delete process.env[key]
    }
  }
  for (const [key, value] of Object.entries(envSnapshot)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

const createFirebaseModule = () => {
  const store = new Map<string, unknown>()
  let pushIndex = 0

  const ref = (path: string) => ({
    push: () => {
      const key = `k${++pushIndex}`
      return {
        key,
        set: async (value: unknown) => {
          store.set(`${path}/${key}`, value)
        },
      }
    },
    set: async (value: unknown) => {
      store.set(path, value)
    },
    get: async () => ({
      exists: () => store.has(path),
      val: () => store.get(path),
    }),
  })

  return {
    getRtdb: vi.fn(() => ({ ref })),
    verifyIdToken: vi.fn(async () => ({ uid: 'user-123' })),
    verifyAppCheck: vi.fn(async () => true),
  }
}

const loadRoute = async (requireAuth: EnvFlag) => {
  const firebaseModule = createFirebaseModule()
  vi.doMock('@/lib/firebaseAdmin', () => firebaseModule)
  vi.doMock('@/lib/ratelimit/memory', () => {
    const store = new Map<string, { count: number; resetAt: number }>()
    class MockRateLimiter {
      private limit: number
      private windowMs: number
      private prefix: string

      constructor(options: { limit: number; windowMs: number; prefix?: string }) {
        this.limit = options.limit
        this.windowMs = options.windowMs
        this.prefix = options.prefix ?? 'rl'
      }

      async check(key: string) {
        const now = Date.now()
        const scopedKey = `${this.prefix}:${key}`
        const entry = store.get(scopedKey)
        if (!entry || entry.resetAt <= now) {
          const resetAt = now + this.windowMs
          store.set(scopedKey, { count: 1, resetAt })
          return { success: true, reset: resetAt }
        }
        if (entry.count < this.limit) {
          entry.count += 1
          return { success: true, reset: entry.resetAt }
        }
        return { success: false, reset: entry.resetAt }
      }
    }
    return { MemoryRateLimiter: MockRateLimiter }
  })
  vi.doMock('@/lib/env', () => ({
    env: {
      GOOGLE_API_KEY: '',
      GEMINI_MODEL: 'gemini-2.5-flash',
      RTDB_REQUIRE_AUTH: requireAuth,
    },
  }))
  const mod = await import('../../app/api/rtdb/route')
  return { ...mod }
}

const mkReq = (body: unknown, headers: Record<string, string> = {}, ip = '127.0.0.1') =>
  ({
    headers: new Headers({ 'content-type': 'application/json', ...headers }),
    json: async () => body,
    ip,
    url: 'http://test.local/api/rtdb',
  } as unknown as Request)

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unmock('@/lib/firebaseAdmin')
  vi.unmock('@/lib/ratelimit/memory')
  vi.unmock('@/lib/env')
  restoreEnv()
})

describe('RTDB route POST handler', () => {
  it('rejects missing auth token when auth is required', async () => {
    process.env.NODE_ENV = 'production'
    const { POST } = await loadRoute('true')

    const res = await POST(
      mkReq({ path: 'tests/auth', data: { ok: true }, method: 'set' })
    )

    expect(res.status).toBe(401)
  })

  it('accepts writes when auth is disabled in development', async () => {
    process.env.NODE_ENV = 'development'
    const { POST } = await loadRoute('false')

    const res = await POST(
      mkReq({ path: 'tests/dev', data: { ok: true }, method: 'set' })
    )

    const body = await res.json()
    expect(res.status, JSON.stringify(body)).toBe(200)
    expect(body).toMatchObject({ ok: true, mode: 'set' })
  })

  it('rate limits after repeated calls from the same IP when unauthenticated', async () => {
    process.env.NODE_ENV = 'development'
    const { POST } = await loadRoute('false')

    let saw429 = false
    for (let i = 0; i < 25; i += 1) {
      const res = await POST(
        mkReq(
          { path: 'tests/rl', data: { idx: i }, method: 'push' },
          { 'x-forwarded-for': '203.0.113.42' }
        )
      )
      if (res.status === 429) {
        saw429 = true
        break
      }
    }

    expect(saw429).toBe(true)
  })
})
