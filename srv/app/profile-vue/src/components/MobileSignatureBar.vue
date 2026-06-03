<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'
import SignatureRail from './SignatureRail.vue'

const open = ref(false)
const { signatureUrl, scnId } = storeToRefs(useProfileStore())

function handleImgError(e: Event) {
  ;(e.target as HTMLImageElement).src = '/profile/badge-placeholder.svg'
}
</script>

<template>
  <div class="mobile-bar">
    <button
      class="mobile-bar__button"
      :aria-expanded="open"
      :aria-label="$t(open ? 'mobile.collapse' : 'mobile.expand')"
      @click="open = !open"
      data-testid="mobile-bar-toggle"
    >
      <img
        v-if="scnId"
        :src="signatureUrl"
        :alt="$t('signature.alt', { scnId })"
        @error="handleImgError"
        class="mobile-bar__thumb"
      />
      <span>{{ $t('mobile.preview') }}</span>
    </button>
    <ui5-dialog
      :open="open || undefined"
      :header-text="$t('profile.Toolbar2')"
      stretch
      @close="open = false"
    >
      <SignatureRail />
      <ui5-button
        slot="footer"
        design="Emphasized"
        @click="open = false"
      >{{ $t('mobile.collapse') }}</ui5-button>
    </ui5-dialog>
  </div>
</template>

<style scoped>
.mobile-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--sapList_Background, #fff);
  border-top: 1px solid var(--sapList_BorderColor, #e5e5e5);
  padding: 0.5rem;
}
.mobile-bar__button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.875rem;
}
.mobile-bar__thumb {
  height: 32px;
  width: auto;
}
@media (prefers-reduced-motion: reduce) {
  .mobile-bar { transition: none; }
}
</style>
