import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import BadgeBrowser from '@/components/BadgeBrowser.vue'
import { useProfileStore } from '@/store/profile'

function makeWrapper() {
  return mount(BadgeBrowser, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('BadgeBrowser', () => {
  it('shows view toggle buttons', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid=view-toggle-table]').exists()).toBe(true)
    expect(wrapper.find('[data-testid=view-toggle-grid]').exists()).toBe(true)
  })

  it('renders BadgeTable when viewMode is "table"', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.viewMode = 'table'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid=badge-table]').exists()).toBe(true)
    expect(wrapper.find('[data-testid=badge-grid]').exists()).toBe(false)
  })

  it('renders BadgeGrid when viewMode is "grid"', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.viewMode = 'grid'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid=badge-grid]').exists()).toBe(true)
    expect(wrapper.find('[data-testid=badge-table]').exists()).toBe(false)
  })
})
