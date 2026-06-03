import { describe, it, expect, vi, beforeEach } from 'vitest'
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

// Mock the theme module so we can drive what readPreference() returns and spy
// on setPreference() — the AppHeader test doesn't care about real DOM/storage
// side effects, only the cycle order.
const readPreferenceMock = vi.fn(() => 'auto')
const setPreferenceMock = vi.fn()
vi.mock('@/theme', () => ({
  readPreference: () => readPreferenceMock(),
  setPreference: (p: unknown) => setPreferenceMock(p)
}))

import AppHeader from '@/components/AppHeader.vue'
import { setLocale, SUPPORTED_LOCALES } from '@/i18n'

function mountHeader() {
  return mount(AppHeader, {
    global: {
      mocks: { $t: (k: string) => k, $i18n: { locale: 'en' } }
    }
  })
}

describe('AppHeader', () => {
  beforeEach(() => {
    readPreferenceMock.mockReset()
    setPreferenceMock.mockReset()
    readPreferenceMock.mockReturnValue('auto')
  })

  it('renders all 11 supported locales', () => {
    const wrapper = mountHeader()
    const opts = wrapper.findAll('[data-testid=locale-option]')
    expect(opts).toHaveLength(SUPPORTED_LOCALES.length)
  })

  it('changing locale calls setLocale', async () => {
    const wrapper = mountHeader()
    const select = wrapper.find('[data-testid=locale-select]')
    await select.setValue('de')
    await select.trigger('change')
    expect(setLocale).toHaveBeenCalledWith('de')
  })

  it('starts in the preference reported by readPreference() (auto)', () => {
    readPreferenceMock.mockReturnValue('auto')
    const wrapper = mountHeader()
    expect(wrapper.find('[data-testid=theme-toggle-auto]').exists()).toBe(true)
  })

  it('cycles auto → light → dark → auto on click', async () => {
    readPreferenceMock.mockReturnValue('auto')
    const wrapper = mountHeader()

    await wrapper.find('[data-testid=theme-toggle-auto]').trigger('click')
    expect(setPreferenceMock).toHaveBeenLastCalledWith('sap_horizon')
    expect(wrapper.find('[data-testid=theme-toggle-sap_horizon]').exists()).toBe(true)

    await wrapper.find('[data-testid=theme-toggle-sap_horizon]').trigger('click')
    expect(setPreferenceMock).toHaveBeenLastCalledWith('sap_horizon_dark')
    expect(wrapper.find('[data-testid=theme-toggle-sap_horizon_dark]').exists()).toBe(true)

    await wrapper.find('[data-testid=theme-toggle-sap_horizon_dark]').trigger('click')
    expect(setPreferenceMock).toHaveBeenLastCalledWith('auto')
    expect(wrapper.find('[data-testid=theme-toggle-auto]').exists()).toBe(true)
  })

  it('mounts with the saved preference (light) when readPreference returns it', () => {
    readPreferenceMock.mockReturnValue('sap_horizon')
    const wrapper = mountHeader()
    expect(wrapper.find('[data-testid=theme-toggle-sap_horizon]').exists()).toBe(true)
  })
})

