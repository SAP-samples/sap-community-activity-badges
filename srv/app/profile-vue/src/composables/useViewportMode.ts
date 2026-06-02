import { ref, onMounted, onBeforeUnmount } from 'vue'

export type ViewportMode = 'mobile' | 'desktop'

const MOBILE_QUERY = '(max-width: 768px)'

export function useViewportMode() {
  const mode = ref<ViewportMode>(
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
      ? 'mobile'
      : 'desktop'
  )

  let mql: MediaQueryList | null = null
  const onChange = (e: MediaQueryListEvent) => {
    mode.value = e.matches ? 'mobile' : 'desktop'
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    mql = window.matchMedia(MOBILE_QUERY)
    mql.addEventListener('change', onChange)
  })

  onBeforeUnmount(() => {
    mql?.removeEventListener('change', onChange)
    mql = null
  })

  // Trigger immediate evaluation outside lifecycle hooks for SSR/test contexts
  if (typeof window !== 'undefined' && !mql) {
    const initial = window.matchMedia(MOBILE_QUERY)
    initial.addEventListener('change', onChange)
    mql = initial
  }

  return { mode }
}
