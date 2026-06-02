<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const { profile } = storeToRefs(useProfileStore())
</script>

<template>
  <section v-if="profile" class="profile-details">
    <dl>
      <dt>{{ $t('profile.login') }}</dt><dd>{{ profile.login }}</dd>
      <dt>{{ $t('profile.fname') }}</dt><dd>{{ profile.first_name }}</dd>
      <dt>{{ $t('profile.lname') }}</dt><dd>{{ profile.last_name }}</dd>
      <dt>{{ $t('profile.rank') }}</dt><dd>{{ profile.rank?.name }}</dd>
      <dt>{{ $t('profile.url') }}</dt>
      <dd>
        <ui5-link
          v-if="profile.view_href"
          :href="profile.view_href"
          target="_blank"
        >{{ profile.view_href }}</ui5-link>
      </dd>
    </dl>
  </section>
</template>

<style scoped>
.profile-details {
  margin-top: 1rem;
}
.profile-details dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 1rem;
  row-gap: 0.5rem;
  margin: 0;
}
.profile-details dt {
  font-weight: 600;
  color: var(--sapNeutralTextColor);
}
.profile-details dd {
  margin: 0;
}
</style>
