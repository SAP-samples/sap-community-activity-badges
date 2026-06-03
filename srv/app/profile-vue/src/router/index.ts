import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/profile/:scnId?',
    name: 'profile',
    component: () => import('@/components/ProfileApp.vue'),
    props: true
  }
  // Intentionally NO catch-all. With `createWebHistory('/profile/')`, the router
  // only sees URLs under /profile/, and Express owns the rest (/, /flp, /selfie,
  // /khoros, etc.). A catch-all here would also intercept dev-server requests
  // like /flp/ on the Vite dev port (5173) and redirect them — those should fall
  // through with a 404 instead, since Vite isn't supposed to serve them anyway.
]

export const router = createRouter({
  history: createWebHistory('/profile/'),
  routes
})
