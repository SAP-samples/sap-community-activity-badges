import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import de from './locales/de.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import hi from './locales/hi.json'
import iKlingon from './locales/i-klingon.json'
import it from './locales/it.json'
import iw from './locales/iw.json'
import ja from './locales/ja.json'
import la from './locales/la.json'
import pl from './locales/pl.json'

export const SUPPORTED_LOCALES = [
  'en', 'de', 'es', 'fr', 'hi', 'i-klingon', 'it', 'iw', 'ja', 'la', 'pl'
] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

const STORAGE_KEY = 'profileLocale'

function detectInitialLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LOCALES.includes(saved as SupportedLocale)) {
      return saved as SupportedLocale
    }
  } catch { /* localStorage unavailable; fall through */ }
  const browser = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase()
  // Match exact codes first (e.g. 'i-klingon'), then primary subtag.
  if (SUPPORTED_LOCALES.includes(browser as SupportedLocale)) {
    return browser as SupportedLocale
  }
  const primary = browser.split('-')[0]
  if (SUPPORTED_LOCALES.includes(primary as SupportedLocale)) {
    return primary as SupportedLocale
  }
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en, de, es, fr, hi, 'i-klingon': iKlingon, it, iw, ja, la, pl
  }
})

export function setLocale(locale: SupportedLocale): void {
  ;(i18n.global.locale as unknown as { value: SupportedLocale }).value = locale
  document.documentElement.setAttribute('lang', locale)
  try { localStorage.setItem(STORAGE_KEY, locale) } catch { /* ignore */ }
}
