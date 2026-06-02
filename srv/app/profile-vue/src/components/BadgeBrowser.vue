<script setup lang="ts">
import { useProfileStore } from '@/store/profile'
import BadgeTable from './BadgeTable.vue'
import BadgeGrid from './BadgeGrid.vue'

const store = useProfileStore()
</script>

<template>
  <section class="badge-browser">
    <header class="badge-browser__head">
      <h3>{{ $t('profile.badges') }}</h3>
      <div class="badge-browser__toggle" role="group" :aria-label="$t('view.table')">
        <ui5-button
          :design="store.viewMode === 'table' ? 'Emphasized' : 'Default'"
          icon="table-view"
          @click="store.setViewMode('table')"
          data-testid="view-toggle-table"
        >{{ $t('view.table') }}</ui5-button>
        <ui5-button
          :design="store.viewMode === 'grid' ? 'Emphasized' : 'Default'"
          icon="grid-view"
          @click="store.setViewMode('grid')"
          data-testid="view-toggle-grid"
        >{{ $t('view.grid') }}</ui5-button>
      </div>
    </header>
    <BadgeTable v-if="store.viewMode === 'table'" />
    <BadgeGrid v-else />
  </section>
</template>

<style scoped>
.badge-browser__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.badge-browser__toggle {
  display: flex;
  gap: 0.25rem;
}
</style>
