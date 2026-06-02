import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useViewportMode } from '@/composables/useViewportMode'

function mockMatchMedia(matches: boolean) {
  let listener: ((e: MediaQueryListEvent) => void) | null = null
  const mql = {
    matches,
    media: '(max-width: 768px)',
    addEventListener: vi.fn((_evt: string, fn: typeof listener) => { listener = fn }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn()
  }
  vi.stubGlobal('matchMedia', vi.fn(() => mql))
  return {
    fire: (newMatches: boolean) => listener?.({ matches: newMatches } as MediaQueryListEvent)
  }
}

describe('useViewportMode', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('returns "mobile" when (max-width: 768px) matches', () => {
    mockMatchMedia(true)
    const { mode } = useViewportMode()
    expect(mode.value).toBe('mobile')
  })

  it('returns "desktop" when it does not match', () => {
    mockMatchMedia(false)
    const { mode } = useViewportMode()
    expect(mode.value).toBe('desktop')
  })

  it('reacts to media query change events', () => {
    const ctl = mockMatchMedia(false)
    const { mode } = useViewportMode()
    expect(mode.value).toBe('desktop')
    ctl.fire(true)
    expect(mode.value).toBe('mobile')
  })
})
