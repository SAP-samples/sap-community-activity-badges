import { KhorosError, type KhorosResponse } from '@/types/khoros'

/**
 * Loads a Khoros user profile via the existing Express endpoint.
 * The only network call this app makes (signature <img> tags trigger
 * their own browser-native loads).
 */
export async function loadUserProfile(scnId: string): Promise<KhorosResponse> {
  const url = `/khoros/user/${encodeURIComponent(scnId)}`

  let response: Response
  try {
    response = await fetch(url, { method: 'GET' })
  } catch (err) {
    throw new KhorosError('network', err instanceof Error ? err.message : 'network error')
  }

  if (!response.ok) {
    const code = response.status === 404 ? 'notFound' : 'unexpected'
    const body = await response.text().catch(() => '')
    throw new KhorosError(code, body || `HTTP ${response.status}`, response.status)
  }

  try {
    return (await response.json()) as KhorosResponse
  } catch (err) {
    throw new KhorosError(
      'unexpected',
      err instanceof Error ? err.message : 'invalid JSON',
      response.status
    )
  }
}
