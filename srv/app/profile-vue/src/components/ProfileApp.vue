<script setup lang="ts">
defineProps<{ scnId?: string }>()
</script>

<template>
  <main class="profile-app">
    <h1>Profile UI (placeholder)</h1>
    <p v-if="$props.scnId">SCN ID: {{ $props.scnId }}</p>
  </main>
</template>

<style scoped>
.profile-app { padding: 1rem; }
</style>
