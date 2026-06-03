import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ locale: { value: 'en' } })
}))

vi.mock('@ui5/webcomponents-base/dist/config/Theme.js', () => ({
  setTheme: vi.fn()
}))

vi.mock('@/i18n', () => ({
  setLocale: vi.fn(),
  SUPPORTED_LOCALES: ['en', 'de', 'es', 'fr', 'hi', 'i-klingon', 'it', 'iw', 'ja', 'la', 'pl']
}))

import AppHeader from '@/components/AppHeader.vue'
import { setLocale, SUPPORTED_LOCALES } from '@/i18n'

describe('AppHeader', () => {
  it('renders all 11 supported locales', () => {
    const wrapper = mount(AppHeader, {
      global: {
        mocks: { $t: (k: string) => k, $i18n: { locale: 'en' } }
      }
    })
    const opts = wrapper.findAll('[data-testid=locale-option]')
    expect(opts).toHaveLength(SUPPORTED_LOCALES.length)
  })

  it('changing locale calls setLocale', async () => {
    const wrapper = mount(AppHeader, {
      global: {
        mocks: { $t: (k: string) => k, $i18n: { locale: 'en' } }
      }
    })
    const select = wrapper.find('[data-testid=locale-select]')
    await select.setValue('de')
    await select.trigger('change')
    expect(setLocale).toHaveBeenCalledWith('de')
  })
})
