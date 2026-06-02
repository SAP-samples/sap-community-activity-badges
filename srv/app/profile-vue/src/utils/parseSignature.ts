/**
 * Extracts up to 5 badge IDs from the embedded <img> in a Khoros signature HTML.
 *
 * Mirrors the original SAPUI5 controller logic:
 *   pathname = url.pathname.split('/')
 *   for badgeIndex in 0..4: pathname[badgeIndex + 3]
 *
 * Returns a fixed-length-5 array, padding empty slots with ''.
 * Tolerates: undefined input, missing <img>, missing src, invalid URL.
 */
export function parseSignatureBadgeIds(signatureHtml: string | undefined): string[] {
  const empty = ['', '', '', '', '']
  if (!signatureHtml) return empty

  let src: string | null = null
  try {
    const doc = new DOMParser().parseFromString(signatureHtml, 'text/html')
    const img = doc.querySelector('img')
    src = img ? img.getAttribute('src') : null
  } catch {
    return empty
  }
  if (!src) return empty

  let pathname: string
  try {
    pathname = new URL(src).pathname
  } catch {
    return empty
  }

  const segments = pathname.split('/')
  return [0, 1, 2, 3, 4].map((badgeIndex) => segments[badgeIndex + 3] ?? '')
}
