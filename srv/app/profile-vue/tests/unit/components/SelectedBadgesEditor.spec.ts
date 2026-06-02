import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SelectedBadgesEditor from '@/components/SelectedBadgesEditor.vue'
import { useProfileStore } from '@/store/profile'

function makeWrapper() {
  return mount(SelectedBadgesEditor, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('SelectedBadgesEditor', () => {
  it('always renders 5 slot rows', () => {
    const wrapper = makeWrapper()
    expect(wrapper.findAll('[data-testid=slot-row]')).toHaveLength(5)
  })

  it('renders empty placeholders when no badges are selected', () => {
    const wrapper = makeWrapper()
    expect(wrapper.findAll('[data-testid=slot-empty]')).toHaveLength(5)
  })

  it('renders icon + title for filled slots', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = {
      user_badges: { items: [
        { earned_date: '', badge: { id: 'cap', title: 'CAP Champion', icon_url: 'http://x/cap.png' } }
      ] }
    } as never
    store.selectedBadgeIds[0] = 'cap'
    await wrapper.vm.$nextTick()
    const html = wrapper.html()
    expect(html).toContain('CAP Champion')
    expect(html).toContain('http://x/cap.png')
  })

  it('clicking remove calls store.toggleBadge with the id', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = {
      user_badges: { items: [
        { earned_date: '', badge: { id: 'cap', title: 'CAP', icon_url: '' } }
      ] }
    } as never
    store.selectedBadgeIds[0] = 'cap'
    const spy = vi.spyOn(store, 'toggleBadge')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid=remove-btn-0]').trigger('click')
    expect(spy).toHaveBeenCalledWith('cap')
  })

  it('Alt+ArrowDown on a row calls reorder(from, from+1)', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = {
      user_badges: { items: [
        { earned_date: '', badge: { id: 'a', title: 'A', icon_url: '' } },
        { earned_date: '', badge: { id: 'b', title: 'B', icon_url: '' } }
      ] }
    } as never
    store.selectedBadgeIds[0] = 'a'
    store.selectedBadgeIds[1] = 'b'
    const spy = vi.spyOn(store, 'reorderSelectedBadges')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid=slot-row-0]')
      .trigger('keydown', { key: 'ArrowDown', altKey: true })
    expect(spy).toHaveBeenCalledWith(0, 1)
  })
})
