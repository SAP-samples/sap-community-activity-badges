import { describe, it, expect } from 'vitest'
import { parseSignatureBadgeIds } from '@/utils/parseSignature'

describe('parseSignatureBadgeIds', () => {
  const wrapImg = (src: string) =>
    `<a href="x"><img src="${src}"/></a>`

  it('returns five empty strings when input is undefined', () => {
    expect(parseSignatureBadgeIds(undefined)).toEqual(['', '', '', '', ''])
  })

  it('returns five empty strings when input is empty', () => {
    expect(parseSignatureBadgeIds('')).toEqual(['', '', '', '', ''])
  })

  it('returns five empty strings when there is no <img>', () => {
    expect(parseSignatureBadgeIds('<a href="x">no image</a>')).toEqual(['', '', '', '', ''])
  })

  it('returns five empty strings when <img> has no src', () => {
    expect(parseSignatureBadgeIds('<img/>')).toEqual(['', '', '', '', ''])
  })

  it('extracts up to 5 badge ids from a /showcaseBadgesGroups URL', () => {
    expect(parseSignatureBadgeIds(wrapImg(
      'https://example.test/showcaseBadgesGroups/alice/cap/devto/first/five-year/ten-year'
    ))).toEqual(['cap', 'devto', 'first', 'five-year', 'ten-year'])
  })

  it('pads empty trailing slots when fewer than 5 badges are present', () => {
    expect(parseSignatureBadgeIds(wrapImg(
      'https://example.test/showcaseBadgesGroups/alice/cap'
    ))).toEqual(['cap', '', '', '', ''])
  })

  it('ignores extra path segments past the 5th badge', () => {
    expect(parseSignatureBadgeIds(wrapImg(
      'https://example.test/showcaseBadgesGroups/alice/a/b/c/d/e/f/g'
    ))).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('returns empty slots when the URL is invalid', () => {
    expect(parseSignatureBadgeIds(wrapImg('not a url'))).toEqual(['', '', '', '', ''])
  })
})
