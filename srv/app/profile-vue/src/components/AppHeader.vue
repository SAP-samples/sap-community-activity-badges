<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n'
import { resolveTheme, setPreference, type Theme } from '@/theme'

const { locale } = useI18n()

// Track the *currently rendered* theme (resolved from the user's preference or
// the OS default). Toggling produces an explicit override; the user can clear
// the override by toggling back to the OS-current state — actually no, that
// would still be a saved override. For now there's no "auto" affordance in the
// UI; if you want one, add a third state (e.g. cycle Light → Dark → Auto).
const theme = ref<Theme>(resolveTheme())

function onLocaleChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value as SupportedLocale
  setLocale(v)
}

function toggleTheme() {
  theme.value = theme.value === 'sap_horizon' ? 'sap_horizon_dark' : 'sap_horizon'
  setPreference(theme.value)
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
