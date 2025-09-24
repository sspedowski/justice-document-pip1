import { describe, it, expect } from 'vitest'
import { extractAppCheckToken } from '../app/api/rtdb/auth-util'

function mockReq(headers: Record<string, string | undefined>) {
  return {
    headers: {
      get: (k: string) => headers[k],
    },
  } as any
}

describe('extractAppCheckToken', () => {
  it('returns undefined when missing', () => {
    expect(extractAppCheckToken(mockReq({}))).toBeUndefined()
  })

  it('reads lowercase header', () => {
    expect(extractAppCheckToken(mockReq({ 'x-firebase-appcheck': 'abc' }))).toBe('abc')
  })

  it('reads uppercase header', () => {
    expect(extractAppCheckToken(mockReq({ 'X-Firebase-AppCheck': 'XYZ' }))).toBe('XYZ')
  })
})
