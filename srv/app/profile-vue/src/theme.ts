/**
 * Theme switching helper.
 *
 * Three responsibilities:
 *  1. Tell UI5 Web Components which theme to use (so <ui5-button>, <ui5-input>, etc.
 *     render in light vs dark) via setTheme() from @ui5/webcomponents-base.
 *  2. Swap the active CSS-variables stylesheet (sap_horizon / sap_horizon_dark
 *     from @sap-theming/theming-base-content) so the theme's custom properties
 *     (--sapBackgroundColor, --sapTextColor, ...) cascade to the rest of the
 *     page. We use a SINGLE <link> element whose `href` we change — the
 *     "two links, toggle disabled" pattern is unreliable in some browsers
 *     because disabling a stylesheet doesn't always invalidate cached
 *     computed values from the previous sheet's :root rules.
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
const LINK_ID = 'ui5-theme-vars'

function osPreferredTheme(): Theme {
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'sap_horizon_dark'
    }
  } catch { /* ignore */ }
  return 'sap_horizon'
}

function urlFor(theme: Theme): string {
  return theme === 'sap_horizon_dark' ? darkCssUrl : lightCssUrl
}

/**
 * Ensure the theme <link> exists with the correct href. Idempotent: if it
 * already exists with the right href, this is a no-op; if it exists with a
 * different href, swap it; otherwise create it.
 *
 * Why a single <link> instead of two with `disabled` toggling? The disabled
 * pattern is supported in spec but unreliable in practice — disabling a
 * stylesheet sometimes leaves stale computed values (especially for
 * :root-scoped custom properties), and browsers don't always re-trigger the
 * cascade. Replacing the href forces a fresh stylesheet parse and a
 * recompute, which works deterministically everywhere.
 */
function setStylesheet(theme: Theme): void {
  if (typeof document === 'undefined') return
  const desiredHref = urlFor(theme)
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = LINK_ID
    link.rel = 'stylesheet'
    link.href = desiredHref
    document.head.appendChild(link)
  } else if (link.href !== new URL(desiredHref, document.baseURI).href) {
    link.href = desiredHref
  }
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

/** Apply a concrete theme to the page (UI5 + stylesheet + data-theme). */
export function applyTheme(theme: Theme): void {
  setTheme(theme)
  setStylesheet(theme)
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
