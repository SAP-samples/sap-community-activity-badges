/**
 * Theme switching helper.
 *
 * Two responsibilities:
 *  1. Tell UI5 Web Components which theme to use (so <ui5-button>, <ui5-input>, etc.
 *     render in light vs dark) via setTheme() from @ui5/webcomponents-base.
 *  2. Toggle the matching <link> stylesheet in index.html so the theme's CSS
 *     custom properties (--sapBackgroundColor, --sapTextColor, ...) cascade to
 *     the rest of the page (the SPA shell, custom CSS, etc.). Without this the
 *     UI5 components recolour but the page background does not.
 *
 * Persistence model: tri-state ('auto' | 'sap_horizon' | 'sap_horizon_dark').
 * The default is 'auto' — follow the OS via prefers-color-scheme. The toggle
 * button only writes 'sap_horizon' or 'sap_horizon_dark' to localStorage when
 * the user explicitly overrides. This avoids the common bug where one click
 * permanently overrides the OS preference.
 */
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js'

export type Theme = 'sap_horizon' | 'sap_horizon_dark'
export type ThemePreference = Theme | 'auto'

const STORAGE_KEY = 'profileTheme'

function osPreferredTheme(): Theme {
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'sap_horizon_dark'
    }
  } catch { /* ignore */ }
  return 'sap_horizon'
}

function setStylesheets(theme: Theme): void {
  if (typeof document === 'undefined') return
  const light = document.getElementById('ui5-theme-light') as HTMLLinkElement | null
  const dark = document.getElementById('ui5-theme-dark') as HTMLLinkElement | null
  // The disabled attribute on <link> is the one supported way to gate a stylesheet
  // without removing it from the DOM (browser keeps the file cached for fast switch).
  if (light) light.disabled = theme !== 'sap_horizon'
  if (dark) dark.disabled = theme !== 'sap_horizon_dark'
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
