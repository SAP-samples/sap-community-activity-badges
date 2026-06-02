/**
 * Pure helpers that build signature image URLs and embed snippets.
 * The origin (server URL) is always passed in, so dev/prod work the same way.
 */

/** /showcaseBadgesGroups/:scnId[/:id1...] — empty slots are skipped, order matters. */
export function buildSignatureUrl(scnId: string, badgeIds: readonly string[]): string {
  const tail = badgeIds.filter((id) => id !== '').join('/')
  return tail ? `/showcaseBadgesGroups/${scnId}/${tail}` : `/showcaseBadgesGroups/${scnId}`
}

/** /showcaseSingleBadge/:scnId[/:firstNonEmptyId] — uses only the first non-empty slot. */
export function buildSignatureLightUrl(scnId: string, badgeIds: readonly string[]): string {
  const first = badgeIds.find((id) => id !== '')
  return first ? `/showcaseSingleBadge/${scnId}/${first}` : `/showcaseSingleBadge/${scnId}`
}

/** /showcaseBadges/:scnId[/:id1...] — same shape as full but a different server route. */
export function buildSignatureBigUrl(scnId: string, badgeIds: readonly string[]): string {
  const tail = badgeIds.filter((id) => id !== '').join('/')
  return tail ? `/showcaseBadges/${scnId}/${tail}` : `/showcaseBadges/${scnId}`
}

/** <a href="..." target="_blank"><img src="origin+sigPath"/></a> — for HTML signatures. */
export function buildEmbedHtml(profileUrl: string, sigPath: string, origin: string): string {
  return `<a href="${profileUrl}" target="_blank"><img src="${origin}${sigPath}"/></a>`
}

/** [![alt](origin+sigPath)](profileUrl) — for Markdown contexts (GitHub, blogs). */
export function buildEmbedMarkdown(
  profileUrl: string,
  sigPath: string,
  origin: string,
  alt: string
): string {
  return `[![${alt}](${origin}${sigPath})](${profileUrl})`
}
