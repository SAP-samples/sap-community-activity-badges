<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const store = useProfileStore()
const { allBadges } = storeToRefs(store)

function handleImgError(e: Event) {
  ;(e.target as HTMLImageElement).src = '/profile/badge-placeholder.svg'
}
</script>

<template>
  <div class="badge-grid" data-testid="badge-grid">
    <button
      v-for="row in allBadges"
      :key="row.badge.id"
      type="button"
      class="badge-card"
      :class="{ 'badge-card--selected': row.selected }"
      :aria-pressed="row.selected"
      @click="store.toggleBadge(row.badge.id)"
    >
      <img
        v-if="row.badge.icon_url"
        :src="row.badge.icon_url"
        :alt="row.badge.title"
        @error="handleImgError"
      />
      <span class="badge-card__title">{{ row.badge.title }}</span>
    </button>
  </div>
</template>

<style scoped>
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}
.badge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--sapList_BorderColor, #e5e5e5);
  border-radius: 0.5rem;
  background: var(--sapList_Background, #fff);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8125rem;
  text-align: center;
}
.badge-card--selected {
  border-color: var(--sapButton_Selected_BorderColor, #0a6ed1);
  background: var(--sapList_SelectionBackgroundColor, #ebf5fe);
}
.badge-card img { width: 64px; height: 64px; object-fit: contain; }
.badge-card__title { color: var(--sapTextColor); }
</style>
