import { describe, it, expect } from 'vitest'
import {
  buildSignatureUrl,
  buildSignatureLightUrl,
  buildSignatureBigUrl,
  buildEmbedHtml,
  buildEmbedMarkdown
} from '@/utils/signatureUrls'

describe('buildSignatureUrl', () => {
  it('returns base path when no badges are selected', () => {
    expect(buildSignatureUrl('alice', [])).toBe('/showcaseBadgesGroups/alice')
  })

  it('appends each non-empty badge id in order', () => {
    expect(buildSignatureUrl('alice', ['cap', 'devto', 'first']))
      .toBe('/showcaseBadgesGroups/alice/cap/devto/first')
  })

  it('skips empty slots', () => {
    expect(buildSignatureUrl('alice', ['cap', '', 'first', '', '']))
      .toBe('/showcaseBadgesGroups/alice/cap/first')
  })

  it('preserves order — reordering produces a different URL', () => {
    expect(buildSignatureUrl('alice', ['a', 'b'])).not
      .toBe(buildSignatureUrl('alice', ['b', 'a']))
  })
})

describe('buildSignatureLightUrl', () => {
  it('uses only the first non-empty badge', () => {
    expect(buildSignatureLightUrl('alice', ['cap', 'devto']))
      .toBe('/showcaseSingleBadge/alice/cap')
  })

  it('skips empty leading slots to find the first real badge', () => {
    expect(buildSignatureLightUrl('alice', ['', 'cap', 'devto']))
      .toBe('/showcaseSingleBadge/alice/cap')
  })

  it('returns base path with no badge segment when all slots are empty', () => {
    expect(buildSignatureLightUrl('alice', ['', '', '']))
      .toBe('/showcaseSingleBadge/alice')
  })
})

describe('buildSignatureBigUrl', () => {
  it('uses the showcaseBadges path segment', () => {
    expect(buildSignatureBigUrl('alice', ['cap']))
      .toBe('/showcaseBadges/alice/cap')
  })
})

describe('buildEmbedHtml', () => {
  it('wraps the signature URL in an <a><img/></a> with the passed origin', () => {
    const html = buildEmbedHtml(
      'https://community.sap.com/u/alice',
      '/showcaseBadgesGroups/alice/cap',
      'https://example.test'
    )
    expect(html).toBe(
      '<a href="https://community.sap.com/u/alice" target="_blank">' +
      '<img src="https://example.test/showcaseBadgesGroups/alice/cap"/></a>'
    )
  })
})

describe('buildEmbedMarkdown', () => {
  it('formats as ![alt](url)(profile)', () => {
    const md = buildEmbedMarkdown(
      'https://community.sap.com/u/alice',
      '/showcaseBadgesGroups/alice/cap',
      'https://example.test',
      'Alice signature'
    )
    expect(md).toBe(
      '[![Alice signature](https://example.test/showcaseBadgesGroups/alice/cap)]' +
      '(https://community.sap.com/u/alice)'
    )
  })
})
