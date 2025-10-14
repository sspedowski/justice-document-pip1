import { describe, it, expect, vi } from 'vitest'

type EnvOverrides = Record<string, string | undefined>

const applyOverrides = (snapshot: NodeJS.ProcessEnv, overrides: EnvOverrides) => {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) {
      delete process.env[key]
    }
  }
  for (const [key, value] of Object.entries(snapshot)) {
    process.env[key] = value!
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

const freshEnv = async (overrides: EnvOverrides) => {
  const snapshot = { ...process.env }
  applyOverrides(snapshot, overrides)
  vi.resetModules()
  const { env } = await import('../../src/lib/env')
  applyOverrides(snapshot, {})
  return env
}

describe('env view', () => {
  it('provides defaults for GEMINI_MODEL and typed RTDB flag', async () => {
    const env = await freshEnv({
      NODE_ENV: 'development',
      GEMINI_MODEL: undefined,
      RTDB_REQUIRE_AUTH: 'false',
    })

    expect(env.GEMINI_MODEL).toBeTruthy()
    expect(env.GEMINI_MODEL.length).toBeGreaterThan(0)
    expect(env.RTDB_REQUIRE_AUTH).toBe('false')
  })

  it('defaults RTDB auth to true when NODE_ENV=production and unset', async () => {
    const env = await freshEnv({
      NODE_ENV: 'production',
      RTDB_REQUIRE_AUTH: undefined,
    })

    expect(env.RTDB_REQUIRE_AUTH).toBe('true')
  })
})
