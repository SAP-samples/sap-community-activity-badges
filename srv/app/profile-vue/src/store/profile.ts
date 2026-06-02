import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadUserProfile } from '@/composables/useKhoros'
import { parseSignatureBadgeIds } from '@/utils/parseSignature'
import {
  buildSignatureUrl,
  buildSignatureLightUrl,
  buildSignatureBigUrl,
  buildEmbedHtml,
  buildEmbedMarkdown
} from '@/utils/signatureUrls'
import {
  KhorosError,
  type BadgeWithSelection,
  type KhorosProfile,
  type SelectedBadge
} from '@/types/khoros'

const EMPTY_SLOTS = (): string[] => ['', '', '', '', '']
const SIGNATURE_ALT_FALLBACK = 'SAP Community signature'

export const useProfileStore = defineStore('profile', () => {
  // ── state ──────────────────────────────────────────────────────────────
  const scnId = ref<string>('')
  const profile = ref<KhorosProfile | null>(null)
  const selectedBadgeIds = ref<string[]>(EMPTY_SLOTS())
  const viewMode = ref<'table' | 'grid'>('table')
  const loading = ref(false)
  const error = ref<{ code: 'notFound' | 'network' | 'unexpected'; message: string } | null>(null)
  /** Increments each time toggleBadge rejects a 6th selection, so views can react. */
  const limitErrorTick = ref(0)
  /** Optional alt text override (filled by component layer with i18n string). */
  const signatureAlt = ref(SIGNATURE_ALT_FALLBACK)

  // ── computed ───────────────────────────────────────────────────────────
  const profileUrl = computed(() => profile.value?.view_href ?? '')

  const allBadges = computed<BadgeWithSelection[]>(() => {
    const items = profile.value?.user_badges?.items ?? []
    const sel = new Set(selectedBadgeIds.value.filter((id) => id !== ''))
    return items.map((it) => ({ ...it, selected: sel.has(it.badge.id) }))
  })

  const selectedBadges = computed<SelectedBadge[]>(() => {
    const lookup = new Map<string, BadgeWithSelection>()
    for (const b of allBadges.value) lookup.set(b.badge.id, b)
    return selectedBadgeIds.value.map((id) => {
      if (id === '') return { id: '', title: '', iconUrl: '' }
      const b = lookup.get(id)
      return {
        id,
        title: b?.badge.title ?? id,
        iconUrl: b?.badge.icon_url ?? ''
      }
    })
  })

  const signatureUrl = computed(() => buildSignatureUrl(scnId.value, selectedBadgeIds.value))
  const signatureLightUrl = computed(() => buildSignatureLightUrl(scnId.value, selectedBadgeIds.value))
  const signatureBigUrl = computed(() => buildSignatureBigUrl(scnId.value, selectedBadgeIds.value))

  const embedHtml = computed(() =>
    buildEmbedHtml(profileUrl.value, signatureUrl.value, window.location.origin)
  )
  const embedMarkdown = computed(() =>
    buildEmbedMarkdown(profileUrl.value, signatureUrl.value, window.location.origin, signatureAlt.value)
  )

  // ── actions ────────────────────────────────────────────────────────────
  async function loadProfile(newScnId: string): Promise<void> {
    scnId.value = newScnId
    loading.value = true
    error.value = null
    try {
      const response = await loadUserProfile(newScnId)
      profile.value = response.data ?? null

      if (!response.data?.user_badges) {
        selectedBadgeIds.value = EMPTY_SLOTS()
        error.value = { code: 'unexpected', message: 'Response missing user_badges' }
        return
      }

      // Seed selected ids from the signature HTML, validate against actual badges.
      const fromSig = parseSignatureBadgeIds(response.data.signature)
      const validIds = new Set((response.data.user_badges.items ?? []).map((i) => i.badge.id))
      selectedBadgeIds.value = fromSig.map((id) => (id !== '' && validIds.has(id) ? id : ''))
      // Compact non-empty to the front (preserves user-visible order).
      const compact = selectedBadgeIds.value.filter((id) => id !== '')
      selectedBadgeIds.value = [...compact, ...EMPTY_SLOTS()].slice(0, 5)
    } catch (err) {
      profile.value = null
      selectedBadgeIds.value = EMPTY_SLOTS()
      if (err instanceof KhorosError) {
        error.value = { code: err.code, message: err.message }
      } else {
        error.value = { code: 'unexpected', message: err instanceof Error ? err.message : 'unknown' }
      }
    } finally {
      loading.value = false
    }
  }

  function toggleBadge(badgeId: string): void {
    const ids = [...selectedBadgeIds.value]
    const existing = ids.indexOf(badgeId)
    if (existing !== -1) {
      // deselect: remove and pad tail
      ids.splice(existing, 1)
      ids.push('')
      selectedBadgeIds.value = ids
      return
    }
    // select: insert at first empty slot
    const empty = ids.indexOf('')
    if (empty === -1) {
      limitErrorTick.value++
      return
    }
    ids[empty] = badgeId
    selectedBadgeIds.value = ids
  }

  function reorderSelectedBadges(from: number, to: number): void {
    if (from === to) return
    const ids = [...selectedBadgeIds.value]
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    selectedBadgeIds.value = ids
  }

  function clearSelected(): void {
    selectedBadgeIds.value = EMPTY_SLOTS()
  }

  function setViewMode(mode: 'table' | 'grid'): void {
    viewMode.value = mode
  }

  function setSignatureAlt(text: string): void {
    signatureAlt.value = text || SIGNATURE_ALT_FALLBACK
  }

  return {
    // state
    scnId, profile, selectedBadgeIds, viewMode, loading, error, limitErrorTick, signatureAlt,
    // computed
    profileUrl, allBadges, selectedBadges,
    signatureUrl, signatureLightUrl, signatureBigUrl,
    embedHtml, embedMarkdown,
    // actions
    loadProfile, toggleBadge, reorderSelectedBadges, clearSelected, setViewMode, setSignatureAlt
  }
})
