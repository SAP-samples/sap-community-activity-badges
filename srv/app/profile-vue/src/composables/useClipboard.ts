export type CopyResult = 'copied' | 'fallback'

/**
 * Copies text to the system clipboard.
 * Returns 'copied' if the modern API succeeded, 'fallback' if the caller
 * should display a "select-and-copy-manually" hint instead.
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return 'fallback'
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'fallback'
  }
}
