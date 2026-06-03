import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/profile/:scnId?',
    name: 'profile',
    component: () => import('@/components/ProfileApp.vue'),
    props: true
  },
  // Catch-all → redirect to bare /profile
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'profile' }
  }
]

export const router = createRouter({
  history: createWebHistory('/profile/'),
  routes
})
