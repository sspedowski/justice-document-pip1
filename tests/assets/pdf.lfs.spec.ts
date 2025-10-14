import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const pdfPaths = [
  new URL('../../pdfs/example1.pdf', import.meta.url),
  new URL('../../pdfs/example2.pdf', import.meta.url),
]

describe('PDF assets', () => {
  it('are real PDFs and not Git LFS pointer files', () => {
    for (const path of pdfPaths) {
      const buffer = readFileSync(path)
      expect(buffer.byteLength).toBeGreaterThan(100)
      const head = buffer.subarray(0, 40).toString('utf8')
      expect(head.startsWith('version https://git-lfs.github.com/spec')).toBe(false)
      expect(head.startsWith('%PDF')).toBe(true)
    }
  })
})
