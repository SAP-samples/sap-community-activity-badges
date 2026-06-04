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

/**
 * <ui5-tabcontainer> fires `tab-select` (CustomEvent) with the selected
 * tab DOM element on event.detail.tab. We tag each <ui5-tab> with a
 * data-tab-key='html' | 'markdown' | 'url' so we can read it back here.
 */
function onTabSelect(e: Event) {
  const detail = (e as CustomEvent<{ tab?: HTMLElement }>).detail
  const key = detail?.tab?.getAttribute('data-tab-key')
  if (key === 'html' || key === 'markdown' || key === 'url') {
    activeTab.value = key
  }
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

    <ui5-tabcontainer
      class="sig-rail__tabs"
      tabs-overflow-mode="End"
      @tab-select="onTabSelect"
    >
      <ui5-tab
        :text="$t('embed.html')"
        :selected="activeTab === 'html' || undefined"
        data-tab-key="html"
      >
        <pre data-testid="embed-html-text">{{ embedHtml }}</pre>
      </ui5-tab>
      <ui5-tab
        :text="$t('embed.markdown')"
        :selected="activeTab === 'markdown' || undefined"
        data-tab-key="markdown"
      >
        <pre data-testid="embed-md-text">{{ embedMarkdown }}</pre>
      </ui5-tab>
      <ui5-tab
        :text="$t('embed.url')"
        :selected="activeTab === 'url' || undefined"
        data-tab-key="url"
      >
        <pre data-testid="embed-url-text">{{ fullEmbedUrl }}</pre>
      </ui5-tab>
    </ui5-tabcontainer>

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
  margin-top: 0.5rem;
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
  color: var(--sapTextColor, #131e29);
}
.sig-rail__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
