<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n'
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js'

const { locale } = useI18n()

function detectInitialTheme(): 'sap_horizon' | 'sap_horizon_dark' {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('profileTheme') : null
    if (saved === 'sap_horizon' || saved === 'sap_horizon_dark') return saved
  } catch { /* ignore */ }
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'sap_horizon_dark'
    }
  } catch { /* ignore */ }
  return 'sap_horizon'
}

const theme = ref<'sap_horizon' | 'sap_horizon_dark'>(detectInitialTheme())

function onLocaleChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value as SupportedLocale
  setLocale(v)
}

function toggleTheme() {
  theme.value = theme.value === 'sap_horizon' ? 'sap_horizon_dark' : 'sap_horizon'
  setTheme(theme.value)
  try { localStorage.setItem('profileTheme', theme.value) } catch { /* ignore */ }
}
</script>

<template>
  <header class="app-header">
    <h1>{{ $t('appTitle') }}</h1>
    <div class="app-header__controls">
      <select
        data-testid="locale-select"
        :value="locale"
        @change="onLocaleChange"
        :aria-label="'Locale'"
      >
        <option
          v-for="loc in SUPPORTED_LOCALES"
          :key="loc"
          :value="loc"
          data-testid="locale-option"
        >{{ loc }}</option>
      </select>
      <ui5-button
        design="Transparent"
        @click="toggleTheme"
        :aria-label="$t('theme.toggle')"
      >🌓</ui5-button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--sapList_BorderColor, #e5e5e5);
  background: var(--sapShellColor, #354a5f);
  color: var(--sapShell_TextColor, #fff);
}
.app-header h1 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}
.app-header__controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.app-header__controls select {
  background: transparent;
  color: inherit;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
}
</style>
