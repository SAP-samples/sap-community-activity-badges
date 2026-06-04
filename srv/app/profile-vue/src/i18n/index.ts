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

/** True when `code` is one of the locales we ship messages for. */
export function isSupportedLocale(code: string): code is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(code)
}

const STORAGE_KEY = 'profileLocale'

function detectInitialLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && isSupportedLocale(saved)) return saved
  } catch { /* localStorage unavailable; fall through */ }
  const browser = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase()
  // Match exact codes first (e.g. 'i-klingon'), then primary subtag.
  if (isSupportedLocale(browser)) return browser
  const primary = browser.split('-')[0]
  if (isSupportedLocale(primary)) return primary
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

/**
 * Set the active locale. No-op for unsupported codes.
 *
 * vue-i18n v10's Composition API types `i18n.global.locale` as a
 * `WritableComputedRef<string>` whose `.value` is `string` — but mutating it
 * is supported and is the documented way to switch locale at runtime. The
 * single-property cast below narrows the type to what we actually use without
 * resorting to `as unknown` or `as never`.
 */
export function setLocale(locale: string): void {
  if (!isSupportedLocale(locale)) return
  const ref = i18n.global.locale as { value: SupportedLocale }
  ref.value = locale
  document.documentElement.setAttribute('lang', locale)
  try { localStorage.setItem(STORAGE_KEY, locale) } catch { /* ignore */ }
}

/** Read the current locale (typed). */
export function currentLocale(): SupportedLocale {
  const value = (i18n.global.locale as { value: string }).value
  return isSupportedLocale(value) ? value : 'en'
}
