import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ErrorBanner from '@/components/ErrorBanner.vue'
import { useProfileStore } from '@/store/profile'

function makeWrapper() {
  return mount(ErrorBanner, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('ErrorBanner', () => {
  it('renders nothing when error is null', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid=error-banner]').exists()).toBe(false)
  })

  it('renders banner with notFound message when error.code is notFound', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.error = { code: 'notFound', message: 'X' }
    store.scnId = 'ghost'
    await wrapper.vm.$nextTick()
    const banner = wrapper.find('[data-testid=error-banner]')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('error.notFound')
  })

  it('emits "retry" when retry button is clicked', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.error = { code: 'network', message: 'X' }
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid=error-retry]').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })
})
