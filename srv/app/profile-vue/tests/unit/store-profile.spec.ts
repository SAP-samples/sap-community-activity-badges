import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import fixture from './fixtures/khoros-user.json'

vi.mock('@/composables/useKhoros', () => ({
  loadUserProfile: vi.fn()
}))

import { loadUserProfile } from '@/composables/useKhoros'
import { useProfileStore } from '@/store/profile'
import { KhorosError } from '@/types/khoros'

const mocked = loadUserProfile as unknown as ReturnType<typeof vi.fn>

describe('useProfileStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mocked.mockReset()
    // jsdom default origin is http://localhost:3000
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost:3000/profile/demo_user'),
      writable: true
    })
  })

  it('loadProfile sets profile and seeds selectedBadgeIds from signature', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()

    await store.loadProfile('demo_user')

    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.profile).toEqual(fixture.data)
    // signature in fixture references cap-champion / devtoberfest-2025 / first-blog
    expect(store.selectedBadgeIds.slice(0, 3))
      .toEqual(['cap-champion', 'devtoberfest-2025', 'first-blog'])
    expect(store.selectedBadgeIds).toHaveLength(5)
  })

  it('allBadges marks selected = true for badges referenced in the signature', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    const byId = Object.fromEntries(store.allBadges.map((b) => [b.badge.id, b.selected]))
    expect(byId['cap-champion']).toBe(true)
    expect(byId['devtoberfest-2025']).toBe(true)
    expect(byId['first-blog']).toBe(true)
    expect(byId['five-year']).toBe(false)
  })

  it('signatureUrl is computed from selected ids in order', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    expect(store.signatureUrl)
      .toBe('/showcaseBadgesGroups/demo_user/cap-champion/devtoberfest-2025/first-blog')
    expect(store.signatureLightUrl)
      .toBe('/showcaseSingleBadge/demo_user/cap-champion')
    expect(store.signatureBigUrl)
      .toBe('/showcaseBadges/demo_user/cap-champion/devtoberfest-2025/first-blog')
  })

  it('embedHtml uses window.location.origin', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    expect(store.embedHtml).toContain('http://localhost:3000/showcaseBadgesGroups/demo_user/')
    expect(store.embedHtml).toContain(fixture.data.view_href!)
  })

  it('toggleBadge adds a fourth badge into the next free slot', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    store.toggleBadge('five-year')
    expect(store.selectedBadgeIds.slice(0, 4))
      .toEqual(['cap-champion', 'devtoberfest-2025', 'first-blog', 'five-year'])
    expect(store.selectedBadgeIds[4]).toBe('')
  })

  it('toggleBadge enforces the 5-badge cap and emits a limit error', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    // Already 3 selected. Add 2 more to reach 5, then try a 6th.
    store.toggleBadge('five-year')
    // augment fixture with synthetic badges to reach 5
    store.selectedBadgeIds[4] = 'fake-fifth'

    const before = [...store.selectedBadgeIds]
    store.toggleBadge('first-blog-2') // any unselected id
    expect(store.selectedBadgeIds).toEqual(before)
    expect(store.limitErrorTick).toBeGreaterThan(0)
  })

  it('toggleBadge deselect removes id and pads the tail with empty string', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    store.toggleBadge('devtoberfest-2025') // currently slot 1
    expect(store.selectedBadgeIds).toEqual(['cap-champion', 'first-blog', '', '', ''])
  })

  it('reorderSelectedBadges swaps positions', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    store.reorderSelectedBadges(0, 2)
    expect(store.selectedBadgeIds.slice(0, 3))
      .toEqual(['devtoberfest-2025', 'first-blog', 'cap-champion'])
  })

  it('loadProfile sets error.code = notFound on KhorosError 404', async () => {
    mocked.mockRejectedValueOnce(new KhorosError('notFound', 'no such user', 404))
    const store = useProfileStore()

    await store.loadProfile('ghost')

    expect(store.profile).toBeNull()
    expect(store.error?.code).toBe('notFound')
    expect(store.loading).toBe(false)
  })

  it('loadProfile gracefully handles a payload missing user_badges', async () => {
    mocked.mockResolvedValueOnce({ data: { id: '1', login: 'x', signature: '' } })
    const store = useProfileStore()

    await store.loadProfile('x')

    expect(store.allBadges).toEqual([])
    expect(store.selectedBadgeIds).toEqual(['', '', '', '', ''])
    expect(store.error?.code).toBe('unexpected')
  })

  it('clearSelected resets selection to all empty', async () => {
    mocked.mockResolvedValueOnce(fixture)
    const store = useProfileStore()
    await store.loadProfile('demo_user')

    store.clearSelected()
    expect(store.selectedBadgeIds).toEqual(['', '', '', '', ''])
  })
})
