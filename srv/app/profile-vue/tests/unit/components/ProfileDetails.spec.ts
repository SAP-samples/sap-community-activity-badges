import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ProfileDetails from '@/components/ProfileDetails.vue'
import { useProfileStore } from '@/store/profile'

function makeWrapper() {
  return mount(ProfileDetails, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('ProfileDetails', () => {
  it('renders nothing when no profile is loaded', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toBe('')
  })

  it('renders login, name, rank, and profile URL when loaded', async () => {
    const wrapper = makeWrapper()
    const store = useProfileStore()
    store.profile = {
      login: 'alice', first_name: 'Alice', last_name: 'Doe',
      view_href: 'https://community.sap.com/u/alice',
      rank: { name: 'Active Contributor' }
    } as never
    await wrapper.vm.$nextTick()
    const html = wrapper.html()
    expect(html).toContain('alice')
    expect(html).toContain('Alice')
    expect(html).toContain('Doe')
    expect(html).toContain('Active Contributor')
    expect(html).toContain('https://community.sap.com/u/alice')
  })
})
