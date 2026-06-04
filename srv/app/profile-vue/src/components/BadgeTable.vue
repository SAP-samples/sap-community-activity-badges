<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const store = useProfileStore()
const { allBadges } = storeToRefs(store)

const filter = ref('')
const sortBy = ref<'title' | 'earned' | 'awarded'>('earned')
const sortDir = ref<'asc' | 'desc'>('desc')

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  let list = q
    ? allBadges.value.filter((b) =>
        (b.badge.title ?? '').toLowerCase().includes(q) ||
        b.badge.id.toLowerCase().includes(q))
    : allBadges.value.slice()
  list.sort((a, b) => {
    let cmp = 0
    if (sortBy.value === 'title') {
      cmp = (a.badge.title ?? '').localeCompare(b.badge.title ?? '')
    } else if (sortBy.value === 'awarded') {
      cmp = (a.badge.awarded ?? 0) - (b.badge.awarded ?? 0)
    } else {
      cmp = (Date.parse(a.earned_date ?? '') || 0) - (Date.parse(b.earned_date ?? '') || 0)
    }
    return sortDir.value === 'asc' ? cmp : -cmp
  })
  return list
})

function toggleSort(col: typeof sortBy.value) {
  if (sortBy.value === col) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortBy.value = col; sortDir.value = 'desc' }
}

// Up/down arrow appended to the active column header. Other columns get nothing.
// We render this as plain text rather than a UI5 sort-icon so it works without
// relying on a UI5 column-level sort API that's still in flux for v2 tables.
function sortIndicator(col: typeof sortBy.value): string {
  if (sortBy.value !== col) return ''
  return sortDir.value === 'asc' ? ' ↑' : ' ↓'
}

function fmtDate(d?: string) {
  if (!d) return ''
  const t = Date.parse(d)
  return isNaN(t) ? d : new Date(t).toLocaleDateString()
}

function handleImgError(e: Event) {
  ;(e.target as HTMLImageElement).src = '/profile/badge-placeholder.svg'
}
</script>

<template>
  <div class="badge-table" data-testid="badge-table">
    <ui5-input
      :value="filter"
      :placeholder="$t('profile.badgeTitle')"
      @input="(e: Event) => (filter = (e.target as HTMLInputElement).value)"
      data-testid="badge-table-filter"
    />
    <ui5-table
      class="badge-table__table"
      no-data-text="No badges"
      overflow-mode="Scroll"
    >
      <ui5-table-header-row slot="headerRow">
        <ui5-table-header-cell>{{ $t('profile.select') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('profile.badgeId') }}</ui5-table-header-cell>
        <ui5-table-header-cell
          class="sortable"
          @click="toggleSort('title')"
        >{{ $t('profile.badgeTitle') }}{{ sortIndicator('title') }}</ui5-table-header-cell>
        <ui5-table-header-cell>{{ $t('profile.badgeImage') }}</ui5-table-header-cell>
        <ui5-table-header-cell
          class="sortable"
          @click="toggleSort('earned')"
        >{{ $t('profile.dateEarned') }}{{ sortIndicator('earned') }}</ui5-table-header-cell>
        <ui5-table-header-cell
          class="sortable"
          @click="toggleSort('awarded')"
        >{{ $t('profile.awarded') }}{{ sortIndicator('awarded') }}</ui5-table-header-cell>
      </ui5-table-header-row>
      <ui5-table-row v-for="row in filtered" :key="row.badge.id">
        <ui5-table-cell>
          <ui5-checkbox
            :checked="row.selected || undefined"
            @change="store.toggleBadge(row.badge.id)"
            :data-testid="`badge-cb-${row.badge.id}`"
          />
        </ui5-table-cell>
        <ui5-table-cell>{{ row.badge.id }}</ui5-table-cell>
        <ui5-table-cell>{{ row.badge.title }}</ui5-table-cell>
        <ui5-table-cell>
          <img
            v-if="row.badge.icon_url"
            :src="row.badge.icon_url"
            :alt="row.badge.title"
            width="48" height="48"
            @error="handleImgError"
          />
        </ui5-table-cell>
        <ui5-table-cell>{{ fmtDate(row.earned_date) }}</ui5-table-cell>
        <ui5-table-cell>{{ row.badge.awarded }}</ui5-table-cell>
      </ui5-table-row>
    </ui5-table>
  </div>
</template>

<style scoped>
.badge-table { display: flex; flex-direction: column; gap: 0.5rem; }
.badge-table__table { width: 100%; }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--sapLinkColor); }
</style>
