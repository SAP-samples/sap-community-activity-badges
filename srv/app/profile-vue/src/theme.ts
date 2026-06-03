/**
 * Theme switching helper.
 *
 * Three responsibilities:
 *  1. Tell UI5 Web Components which theme to use (so <ui5-button>, <ui5-input>, etc.
 *     render in light vs dark) via setTheme() from @ui5/webcomponents-base.
 *  2. Inject and toggle the matching CSS-variables stylesheet (sap_horizon /
 *     sap_horizon_dark from @sap-theming/theming-base-content) so the theme's
 *     custom properties (--sapBackgroundColor, --sapTextColor, ...) cascade to
 *     the rest of the page. Without this the UI5 components recolour but the
 *     page background does not.
 *  3. Persist a tri-state user preference: 'auto' | 'sap_horizon' |
 *     'sap_horizon_dark'. 'auto' (the default — empty localStorage) follows
 *     the OS via prefers-color-scheme; the explicit values are user overrides.
 *
 * The stylesheet URLs are resolved via Vite's `?url` import, so the CSS files
 * are bundled from node_modules at build time (no runtime CDN dependency).
 */
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js'
// Vite resolves these to build-time hashed URLs in dist/assets/. In dev they
// point at the source files inside node_modules. Same code path either way.
import lightCssUrl from '@sap-theming/theming-base-content/content/Base/baseLib/sap_horizon/css_variables.css?url'
import darkCssUrl from '@sap-theming/theming-base-content/content/Base/baseLib/sap_horizon_dark/css_variables.css?url'

export type Theme = 'sap_horizon' | 'sap_horizon_dark'
export type ThemePreference = Theme | 'auto'

const STORAGE_KEY = 'profileTheme'
const LIGHT_LINK_ID = 'ui5-theme-light'
const DARK_LINK_ID = 'ui5-theme-dark'

function osPreferredTheme(): Theme {
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'sap_horizon_dark'
    }
  } catch { /* ignore */ }
  return 'sap_horizon'
}

/**
 * Ensure both <link> stylesheets are present in <head>. Idempotent — safe to
 * call multiple times. We inject from JS rather than declaring in index.html so
 * the URLs (which are content-hashed in production) come from one source.
 */
function ensureStylesheets(): { light: HTMLLinkElement; dark: HTMLLinkElement } | null {
  if (typeof document === 'undefined') return null
  let light = document.getElementById(LIGHT_LINK_ID) as HTMLLinkElement | null
  let dark = document.getElementById(DARK_LINK_ID) as HTMLLinkElement | null
  if (!light) {
    light = document.createElement('link')
    light.id = LIGHT_LINK_ID
    light.rel = 'stylesheet'
    light.href = lightCssUrl
    document.head.appendChild(light)
  }
  if (!dark) {
    dark = document.createElement('link')
    dark.id = DARK_LINK_ID
    dark.rel = 'stylesheet'
    dark.href = darkCssUrl
    document.head.appendChild(dark)
  }
  return { light, dark }
}

function setStylesheets(theme: Theme): void {
  const links = ensureStylesheets()
  if (!links) return
  // The disabled attribute on <link> is the one supported way to gate a stylesheet
  // without removing it from the DOM (browser keeps the file cached for fast switch).
  links.light.disabled = theme !== 'sap_horizon'
  links.dark.disabled = theme !== 'sap_horizon_dark'
  document.documentElement.setAttribute('data-theme', theme)
}

/** Read the stored preference; 'auto' (or no entry) means follow the OS. */
export function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'sap_horizon' || saved === 'sap_horizon_dark') return saved
  } catch { /* ignore */ }
  return 'auto'
}

/** Resolve a preference (including 'auto') to a concrete theme. */
export function resolveTheme(pref: ThemePreference = readPreference()): Theme {
  return pref === 'auto' ? osPreferredTheme() : pref
}

/** Apply a concrete theme to the page (UI5 + stylesheets + data-theme). */
export function applyTheme(theme: Theme): void {
  setTheme(theme)
  setStylesheets(theme)
}

/** Persist an explicit user override. Pass 'auto' to clear back to OS-following. */
export function setPreference(pref: ThemePreference): void {
  try {
    if (pref === 'auto') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, pref)
  } catch { /* ignore */ }
  applyTheme(resolveTheme(pref))
}

/**
 * Wire `prefers-color-scheme` so the page follows OS changes when the user
 * hasn't set an explicit override. Returns a cleanup function.
 */
export function watchOsTheme(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => { /* no-op */ }
  }
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    if (readPreference() === 'auto') applyTheme(osPreferredTheme())
  }
  mql.addEventListener('change', handler)
  return () => mql.removeEventListener('change', handler)
}
