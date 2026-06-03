import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ScnIdInput from '@/components/ScnIdInput.vue'
import { useProfileStore } from '@/store/profile'

const i18nStub = { install: () => {}, global: { t: (k: string) => k } }

function makeWrapper(initial?: string) {
  return mount(ScnIdInput, {
    props: { modelValue: initial ?? '' },
    global: {
      plugins: [createTestingPinia({ stubActions: false }), i18nStub as never],
      mocks: { $t: (k: string) => k }
    }
  })
}

describe('ScnIdInput', () => {
  it('emits "load" with the current value when load button is clicked', async () => {
    const wrapper = makeWrapper('alice')
    await wrapper.find('[data-testid=load-btn]').trigger('click')
    expect(wrapper.emitted('load')?.[0]).toEqual(['alice'])
  })

  it('does not emit "load" when value is empty', async () => {
    const wrapper = makeWrapper('')
    await wrapper.find('[data-testid=load-btn]').trigger('click')
    expect(wrapper.emitted('load')).toBeUndefined()
  })

  it('shows an avatar slot when profile is loaded', async () => {
    const wrapper = makeWrapper('alice')
    const store = useProfileStore()
    store.profile = {
      avatar: { profile: 'http://x/y.png' },
      first_name: 'Alice', last_name: 'Doe',
      rank: { name: 'Active Contributor' }
    } as never
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('Alice')
    expect(wrapper.html()).toContain('Active Contributor')
  })
})
