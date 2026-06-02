import { describe, it, expect } from 'vitest'
import { propertiesToObject } from '@/../scripts/convert-i18n.mjs'

describe('propertiesToObject', () => {
  it('parses simple key=value pairs into a flat object', () => {
    expect(propertiesToObject('a=1\nb=2')).toEqual({ a: '1', b: '2' })
  })

  it('nests dotted keys', () => {
    expect(propertiesToObject('profile.scnId=SAP Community ID'))
      .toEqual({ profile: { scnId: 'SAP Community ID' } })
  })

  it('skips comment lines starting with # or !', () => {
    expect(propertiesToObject('# comment\n!another\nkey=value'))
      .toEqual({ key: 'value' })
  })

  it('skips blank lines', () => {
    expect(propertiesToObject('\n\nkey=value\n\n')).toEqual({ key: 'value' })
  })

  it('decodes \\uXXXX escapes', () => {
    expect(propertiesToObject('greeting=\\u00fcber')).toEqual({ greeting: 'über' })
  })

  it('joins continuation lines (line ending in backslash)', () => {
    expect(propertiesToObject('long=part1 \\\npart2')).toEqual({ long: 'part1 part2' })
  })

  it('preserves later values when a key appears twice', () => {
    expect(propertiesToObject('k=first\nk=second')).toEqual({ k: 'second' })
  })

  it('treats = inside the value as part of the value', () => {
    expect(propertiesToObject('eq=a=b=c')).toEqual({ eq: 'a=b=c' })
  })
})
