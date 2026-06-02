<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'
import { copyToClipboard } from '@/composables/useClipboard'

const store = useProfileStore()
const {
  signatureUrl, signatureLightUrl, signatureBigUrl,
  embedHtml, embedMarkdown, scnId
} = storeToRefs(store)

const activeTab = ref<'html' | 'markdown' | 'url'>('html')
const toastMsg = ref('')
const toastShown = ref(false)

const fullEmbedUrl = computed(() => `${window.location.origin}${signatureUrl.value}`)

const activeText = computed(() => {
  if (activeTab.value === 'markdown') return embedMarkdown.value
  if (activeTab.value === 'url') return fullEmbedUrl.value
  return embedHtml.value
})

async function onCopy() {
  const result = await copyToClipboard(activeText.value)
  toastMsg.value = result === 'copied' ? 'embed.copied' : 'embed.copyFallback'
  toastShown.value = true
  setTimeout(() => (toastShown.value = false), 2500)
}

function handleImgError(e: Event) {
  ;(e.target as HTMLImageElement).src = '/profile/badge-placeholder.svg'
}
</script>

<template>
  <aside class="sig-rail" :aria-label="$t('profile.Toolbar2')">
    <h3>{{ $t('profile.Toolbar2') }}</h3>

    <div class="sig-rail__preview">
      <span class="label">{{ $t('profile.signaturePreview') }}</span>
      <img
        v-if="scnId"
        :src="signatureUrl"
        :alt="$t('signature.alt', { scnId })"
        @error="handleImgError"
        data-testid="preview-full"
      />
    </div>

    <div class="sig-rail__preview">
      <span class="label">{{ $t('profile.signature2Preview') }}</span>
      <img
        v-if="scnId"
        :src="signatureLightUrl"
        :alt="$t('signature.alt', { scnId })"
        @error="handleImgError"
        data-testid="preview-light"
      />
    </div>

    <div class="sig-rail__tabs" role="tablist">
      <button
        :class="['tab', { active: activeTab === 'html' }]"
        @click="activeTab = 'html'"
        :aria-selected="activeTab === 'html'"
      >{{ $t('embed.html') }}</button>
      <button
        :class="['tab', { active: activeTab === 'markdown' }]"
        @click="activeTab = 'markdown'"
        :aria-selected="activeTab === 'markdown'"
      >{{ $t('embed.markdown') }}</button>
      <button
        :class="['tab', { active: activeTab === 'url' }]"
        @click="activeTab = 'url'"
        :aria-selected="activeTab === 'url'"
      >{{ $t('embed.url') }}</button>
    </div>

    <pre v-if="activeTab === 'html'" data-testid="embed-html-text">{{ embedHtml }}</pre>
    <pre v-else-if="activeTab === 'markdown'" data-testid="embed-md-text">{{ embedMarkdown }}</pre>
    <pre v-else data-testid="embed-url-text">{{ fullEmbedUrl }}</pre>

    <div class="sig-rail__actions">
      <ui5-button
        design="Emphasized"
        icon="copy"
        @click="onCopy"
        :data-testid="`copy-${activeTab}`"
      >{{ $t('embed.copy') }}</ui5-button>
      <ui5-link
        v-if="scnId"
        :href="signatureBigUrl"
        target="_blank"
      >big preview ↗</ui5-link>
    </div>

    <ui5-toast
      v-if="toastShown"
      placement="BottomCenter"
      duration="2500"
      open
    >{{ $t(toastMsg) }}</ui5-toast>
  </aside>
</template>

<style scoped>
.sig-rail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--sapList_Background, #fff);
  border: 1px solid var(--sapList_BorderColor, #e5e5e5);
  border-radius: 0.5rem;
}
.sig-rail__preview img {
  display: block;
  max-width: 100%;
  margin-top: 0.25rem;
}
.label {
  font-size: 0.75rem;
  color: var(--sapNeutralTextColor);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.sig-rail__tabs {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
}
.tab {
  flex: 1;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--sapList_BorderColor, #e5e5e5);
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8125rem;
  border-radius: 0.25rem;
}
.tab.active {
  background: var(--sapButton_Selected_Background, #ebf5fe);
  border-color: var(--sapButton_Selected_BorderColor, #0a6ed1);
  color: var(--sapButton_Selected_TextColor, #0854a0);
}
pre {
  margin: 0;
  padding: 0.5rem;
  background: var(--sapField_Background, #f5f6f7);
  border: 1px solid var(--sapField_BorderColor, #d5d7d9);
  border-radius: 0.25rem;
  font-family: var(--sapFontMonoFamily, ui-monospace, monospace);
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
}
.sig-rail__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
