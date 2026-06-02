import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SignatureRail from '@/components/SignatureRail.vue'
import { useProfileStore } from '@/store/profile'

vi.mock('@/composables/useClipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue('copied')
}))
import { copyToClipboard } from '@/composables/useClipboard'

function makeWrapper() {
  return mount(SignatureRail, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('SignatureRail', () => {
  it('binds preview <img> src to store.signatureUrl', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.scnId = 'alice'
    store.selectedBadgeIds[0] = 'cap'
    await wrapper.vm.$nextTick()
    const img = wrapper.find('[data-testid=preview-full]').attributes('src')
    expect(img).toBe('/showcaseBadgesGroups/alice/cap')
  })

  it('renders the HTML embed snippet in the active tab body', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = { view_href: 'http://x' } as never
    store.scnId = 'alice'
    store.selectedBadgeIds[0] = 'cap'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid=embed-html-text]').element.textContent)
      .toContain('<a href="http://x" target="_blank">')
  })

  it('clicking copy invokes copyToClipboard with the active tab\'s text', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = { view_href: 'http://x' } as never
    store.scnId = 'alice'
    store.selectedBadgeIds[0] = 'cap'
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid=copy-html]').trigger('click')
    expect(copyToClipboard).toHaveBeenCalledWith(store.embedHtml)
  })
})
