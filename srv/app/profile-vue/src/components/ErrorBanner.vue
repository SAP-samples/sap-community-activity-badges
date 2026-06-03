<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const emit = defineEmits<{ (e: 'retry'): void }>()

const { error, scnId } = storeToRefs(useProfileStore())

const i18nKey = computed(() => {
  if (!error.value) return ''
  return `error.${error.value.code}`
})
</script>

<template>
  <ui5-message-strip
    v-if="error"
    design="Negative"
    data-testid="error-banner"
    :hide-close-button="true"
  >
    {{ $t(i18nKey, { scnId }) }}
    <ui5-button
      slot="action"
      design="Transparent"
      @click="emit('retry')"
      data-testid="error-retry"
    >{{ $t('error.retry') }}</ui5-button>
  </ui5-message-strip>
</template>
