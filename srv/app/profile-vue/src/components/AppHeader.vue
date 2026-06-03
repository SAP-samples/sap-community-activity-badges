<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n'
import { readPreference, setPreference, type ThemePreference } from '@/theme'

const { locale } = useI18n()

// Track the user's preference, not the resolved theme. 'auto' is the default
// and means "follow OS"; the toggle cycles Light → Dark → Auto so the user
// can always get back to OS-following without clearing localStorage manually.
const preference = ref<ThemePreference>(readPreference())

// Pick an icon that reflects the current preference (NOT the resolved theme):
// - 'auto'              → desktop-mobile (intent: follow device)
// - 'sap_horizon'       → light-mode
// - 'sap_horizon_dark'  → dark-mode
const themeIcon = computed(() => {
  if (preference.value === 'sap_horizon') return 'light-mode'
  if (preference.value === 'sap_horizon_dark') return 'dark-mode'
  return 'desktop-mobile'
})

// Tooltip / aria-label tells the user what *clicking* will do next.
const themeLabelKey = computed(() => {
  if (preference.value === 'sap_horizon') return 'theme.light'
  if (preference.value === 'sap_horizon_dark') return 'theme.dark'
  return 'theme.auto'
})

function onLocaleChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value as SupportedLocale
  setLocale(v)
}

// Cycle order: Light → Dark → Auto → Light. Auto is the rest state we always
// pass through; that gives the user one click to get back to OS-following.
function cycleTheme() {
  const next: ThemePreference =
    preference.value === 'sap_horizon' ? 'sap_horizon_dark'
    : preference.value === 'sap_horizon_dark' ? 'auto'
    : 'sap_horizon'
  preference.value = next
  setPreference(next)
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
        :icon="themeIcon"
        :tooltip="$t(themeLabelKey)"
        :aria-label="$t(themeLabelKey)"
        :data-testid="`theme-toggle-${preference}`"
        @click="cycleTheme"
      />
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

