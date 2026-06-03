<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProfileStore } from '@/store/profile'
import { useViewportMode } from '@/composables/useViewportMode'
import { useI18n } from 'vue-i18n'

import AppHeader from './AppHeader.vue'
import ScnIdInput from './ScnIdInput.vue'
import ProfileDetails from './ProfileDetails.vue'
import SelectedBadgesEditor from './SelectedBadgesEditor.vue'
import BadgeBrowser from './BadgeBrowser.vue'
import SignatureRail from './SignatureRail.vue'
import MobileSignatureBar from './MobileSignatureBar.vue'
import ErrorBanner from './ErrorBanner.vue'

const props = defineProps<{ scnId?: string }>()
const router = useRouter()
const route = useRoute()
const store = useProfileStore()
const { mode } = useViewportMode()
const { t, locale } = useI18n()

const inputValue = ref(props.scnId ?? '')

// Update signature alt as locale changes
watch(locale, () => store.setSignatureAlt(t('signature.alt', { scnId: store.scnId })))

async function load(scnId: string) {
  inputValue.value = scnId
  if (route.params.scnId !== scnId) {
    await router.replace({ name: 'profile', params: { scnId } })
  }
  await store.loadProfile(scnId)
  store.setSignatureAlt(t('signature.alt', { scnId }))
}

// Show a transient toast tied to limitErrorTick
const limitToast = ref(false)
watch(() => store.limitErrorTick, () => {
  limitToast.value = true
  setTimeout(() => (limitToast.value = false), 2500)
})

onMounted(() => {
  if (props.scnId) load(props.scnId)
})
</script>

<template>
  <div class="profile-app">
    <AppHeader />

    <main class="profile-app__main">
      <section class="profile-app__top">
        <ScnIdInput v-model="inputValue" @load="load" />
      </section>

      <ErrorBanner @retry="load(inputValue)" />

      <ui5-busy-indicator :active="store.loading || undefined" delay="0" size="L" />

      <div class="profile-app__body">
        <section class="profile-app__content">
          <ProfileDetails />
          <SelectedBadgesEditor />
          <BadgeBrowser />
        </section>

        <aside v-if="mode === 'desktop'" class="profile-app__rail">
          <SignatureRail />
        </aside>
      </div>
    </main>

    <MobileSignatureBar v-if="mode === 'mobile'" />

    <ui5-toast
      v-if="limitToast"
      placement="BottomCenter"
      duration="2500"
      open
    >{{ $t('profile.limitErr') }}</ui5-toast>
  </div>
</template>

<style scoped>
.profile-app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.profile-app__main {
  flex: 1;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}
.profile-app__top {
  margin-bottom: 1rem;
}
.profile-app__body {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 1.5rem;
  align-items: flex-start;
}
@media (max-width: 768px) {
  .profile-app__body {
    grid-template-columns: 1fr;
  }
}
.profile-app__rail {
  position: sticky;
  top: 1rem;
  align-self: start;
}
</style>
