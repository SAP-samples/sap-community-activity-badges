<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const store = useProfileStore()
const { selectedBadges } = storeToRefs(store)

let dragIndex = -1

function onDragStart(idx: number, e: DragEvent) {
  dragIndex = idx
  e.dataTransfer?.setData('text/plain', String(idx))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

function onDrop(idx: number, e: DragEvent) {
  e.preventDefault()
  if (dragIndex === -1 || dragIndex === idx) return
  store.reorderSelectedBadges(dragIndex, idx)
  dragIndex = -1
}

function onKey(idx: number, e: KeyboardEvent) {
  if (!e.altKey) return
  if (e.key === 'ArrowUp' && idx > 0) {
    e.preventDefault()
    store.reorderSelectedBadges(idx, idx - 1)
  } else if (e.key === 'ArrowDown' && idx < 4) {
    e.preventDefault()
    store.reorderSelectedBadges(idx, idx + 1)
  }
}

function onRemove(id: string | '') {
  if (id === '') return
  store.toggleBadge(id)
}
</script>

<template>
  <section class="selected-badges">
    <h3>{{ $t('profile.selBadges') }}</h3>
    <ul role="list" class="selected-badges__list">
      <li
        v-for="(slot, idx) in selectedBadges"
        :key="idx"
        role="listitem"
        data-testid="slot-row"
        class="slot-wrapper"
      >
        <div
          :data-testid="`slot-row-${idx}`"
          :class="['slot', { 'slot--empty': slot.id === '' }]"
          :tabindex="0"
          :draggable="slot.id !== ''"
          @dragstart="(e) => onDragStart(idx, e)"
          @dragover="onDragOver"
          @drop="(e) => onDrop(idx, e)"
          @keydown="(e) => onKey(idx, e)"
        >
          <span class="slot__handle" aria-hidden="true">⠿</span>
          <span class="slot__index">{{ idx + 1 }}.</span>
          <template v-if="slot.id !== ''">
            <img v-if="slot.iconUrl" :src="slot.iconUrl" :alt="slot.title" class="slot__icon" />
            <span class="slot__title">{{ slot.title }}</span>
            <ui5-button
              icon="decline"
              design="Transparent"
              :tooltip="$t('embed.copy')"
              :data-testid="`remove-btn-${idx}`"
              :aria-label="`Remove ${slot.title}`"
              @click="onRemove(slot.id)"
            />
          </template>
          <template v-else>
            <span data-testid="slot-empty" class="slot__empty">—</span>
          </template>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.selected-badges__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.slot-wrapper {
  list-style: none;
}
.slot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--sapList_BorderColor, #e5e5e5);
  border-radius: 0.25rem;
  background: var(--sapList_Background, #fff);
}
.slot--empty {
  border-style: dashed;
  background: transparent;
  color: var(--sapNeutralTextColor);
}
.slot__handle {
  cursor: grab;
  color: var(--sapNeutralTextColor);
}
.slot__index {
  width: 1.25rem;
  font-variant-numeric: tabular-nums;
}
.slot__icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
.slot__title { flex: 1; }
.slot:focus-visible {
  outline: 2px solid var(--sapContent_FocusColor);
}
</style>
