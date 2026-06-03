<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'load', scnId: string): void
}>()

const store = useProfileStore()
const { profile } = storeToRefs(store)

const fullName = computed(() => {
  const fn = profile.value?.first_name ?? ''
  const ln = profile.value?.last_name ?? ''
  return [fn, ln].filter(Boolean).join(' ')
})

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onLoad() {
  const v = props.modelValue.trim()
  if (!v) return
  emit('load', v)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter') onLoad()
}
</script>

<template>
  <section class="scn-id-input">
    <ui5-label for="scnIdField" required="">{{ $t('profile.scnId') }}</ui5-label>
    <ui5-input
      id="scnIdField"
      :value="modelValue"
      @input="onChange"
      @keydown="onKey"
      data-testid="scn-id-field"
    />
    <ui5-button
      design="Emphasized"
      data-testid="load-btn"
      @click="onLoad"
    >{{ $t('profile.Toolbar1') }}</ui5-button>
    <div v-if="profile" class="user-chip">
      <ui5-avatar
        v-if="profile.avatar?.profile"
        :image="profile.avatar.profile"
        size="S"
        shape="Circle"
      />
      <div class="user-chip__text">
        <strong>{{ fullName || profile.login }}</strong>
        <span v-if="profile.rank?.name">{{ profile.rank.name }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scn-id-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}
.user-chip__text {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}
.user-chip__text span {
  color: var(--sapNeutralTextColor);
}
</style>
