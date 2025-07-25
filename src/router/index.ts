import { createRouter, createWebHistory } from 'vue-router'
import SecurityCheckView from '../views/SecurityCheckView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: SecurityCheckView,
    },
  ],
})

export default router
