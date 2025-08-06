import { createRouter, createWebHistory } from 'vue-router'
import SecurityCheckView from '../views/SecurityCheckView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import MainView from '../views/MainView.vue'
import AuthenticationView from '../views/AuthenticationView.vue'
import AuthenticationFailedView from '../views/AuthenticationFailedView.vue'
import BehaviorView from '../views/BehaviorView.vue'
import BiometricView from '../views/BiometricView.vue'
import TestView from '../views/TestView.vue'

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
    {
      path: '/main',
      name: 'main',
      component: MainView,
    },
    {
      path: '/authentication',
      name: 'authentication',
      component: AuthenticationView,
    },
    {
      path: '/authentication-failed',
      name: 'authentication-failed',
      component: AuthenticationFailedView,
    },
    {
      path: '/behavior',
      name: 'behavior',
      component: BehaviorView,
    },
    {
      path: '/biometric',
      name: 'biometric',
      component: BiometricView,
    },
    {
      path: '/test',
      name: 'test',
      component: TestView,
    },
  ],
})

export default router
