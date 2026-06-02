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
    <table class="grid">
      <thead>
        <tr>
          <th>{{ $t('profile.select') }}</th>
          <th>{{ $t('profile.badgeId') }}</th>
          <th class="sortable" @click="toggleSort('title')">{{ $t('profile.badgeTitle') }}</th>
          <th>{{ $t('profile.badgeImage') }}</th>
          <th class="sortable" @click="toggleSort('earned')">{{ $t('profile.dateEarned') }}</th>
          <th class="sortable" @click="toggleSort('awarded')">{{ $t('profile.awarded') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filtered" :key="row.badge.id">
          <td>
            <ui5-checkbox
              :checked="row.selected || undefined"
              @change="store.toggleBadge(row.badge.id)"
              :data-testid="`badge-cb-${row.badge.id}`"
            />
          </td>
          <td>{{ row.badge.id }}</td>
          <td>{{ row.badge.title }}</td>
          <td>
            <img
              v-if="row.badge.icon_url"
              :src="row.badge.icon_url"
              :alt="row.badge.title"
              width="48" height="48"
              @error="handleImgError"
            />
          </td>
          <td>{{ fmtDate(row.earned_date) }}</td>
          <td>{{ row.badge.awarded }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.badge-table { display: flex; flex-direction: column; gap: 0.5rem; }
.grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.grid th, .grid td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid var(--sapList_BorderColor, #e5e5e5);
  vertical-align: middle;
}
.grid th { font-weight: 600; color: var(--sapNeutralTextColor); }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--sapLinkColor); }
</style>
