import { createRouter, createWebHistory } from 'vue-router'
import SecurityCheckView from '../views/SecurityCheckView.vue'
import WelcomeView from '../views/WelcomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'security-check',
      component: SecurityCheckView,
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomeView,
    },
  ],
})

export default router
