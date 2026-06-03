import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard } from '@/composables/useClipboard'

describe('copyToClipboard', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('uses navigator.clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const result = await copyToClipboard('hello')
    expect(writeText).toHaveBeenCalledWith('hello')
    expect(result).toBe('copied')
  })

  it('falls back to "fallback" when clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const result = await copyToClipboard('hello')
    expect(result).toBe('fallback')
  })

  it('falls back to "fallback" when clipboard.writeText rejects', async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error('blocked'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const result = await copyToClipboard('hello')
    expect(result).toBe('fallback')
  })
})
