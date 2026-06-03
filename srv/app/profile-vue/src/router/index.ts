import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// IMPORTANT: createWebHistory('/profile/') strips the '/profile/' prefix
// from incoming URLs BEFORE the route matcher sees them. So when the browser
// is at /profile/139, the matcher only sees '/139'. Route paths must therefore
// NOT include '/profile/' — they're relative to the history base.
const routes: RouteRecordRaw[] = [
  {
    path: '/:scnId?',
    name: 'profile',
    component: () => import('@/components/ProfileApp.vue'),
    props: true
  }
  // Intentionally NO catch-all. With createWebHistory('/profile/') the router
  // only sees URLs under /profile/, and Express owns everything else
  // (/, /flp, /selfie, /khoros, ...). A catch-all here would also intercept
  // dev-server requests on the Vite dev port (5173) and redirect them.
]

export const router = createRouter({
  history: createWebHistory('/profile/'),
  routes
})
