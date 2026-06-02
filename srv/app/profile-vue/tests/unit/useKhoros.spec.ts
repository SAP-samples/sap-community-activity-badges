import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadUserProfile } from '@/composables/useKhoros'
import { KhorosError } from '@/types/khoros'

describe('loadUserProfile', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('returns parsed JSON on 200', async () => {
    const payload = { data: { id: '1', login: 'alice' } }
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => payload })

    const result = await loadUserProfile('alice')

    expect(fetchMock).toHaveBeenCalledWith('/khoros/user/alice', expect.any(Object))
    expect(result).toEqual(payload)
  })

  it('throws notFound on 404', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, text: async () => 'not found' })
    await expect(loadUserProfile('ghost')).rejects.toMatchObject({
      name: 'KhorosError', code: 'notFound', status: 404
    })
  })

  it('throws unexpected on 500', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' })
    await expect(loadUserProfile('alice')).rejects.toMatchObject({
      code: 'unexpected', status: 500
    })
  })

  it('throws network on fetch rejection', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(loadUserProfile('alice')).rejects.toMatchObject({ code: 'network' })
  })

  it('throws unexpected when response is not valid JSON', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => { throw new SyntaxError('bad json') }
    })
    await expect(loadUserProfile('alice')).rejects.toMatchObject({ code: 'unexpected' })
  })

  it('uri-encodes the scnId', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: {} }) })
    await loadUserProfile('alice bob')
    expect(fetchMock).toHaveBeenCalledWith('/khoros/user/alice%20bob', expect.any(Object))
  })

  it('returned error is an instance of KhorosError', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, text: async () => '' })
    try {
      await loadUserProfile('ghost')
    } catch (e) {
      expect(e).toBeInstanceOf(KhorosError)
    }
  })
})
