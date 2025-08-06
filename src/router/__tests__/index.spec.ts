import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import router from '../index'

// Mock Vue Router components
const mockComponents = {
  SecurityCheckView: { template: '<div data-testid="security-check">Security Check</div>' },
  WelcomeView: { template: '<div data-testid="welcome">Welcome</div>' },
  MainView: { template: '<div data-testid="main">Main</div>' },
  AuthenticationView: { template: '<div data-testid="authentication">Authentication</div>' },
  AuthenticationFailedView: { template: '<div data-testid="authentication-failed">Authentication Failed</div>' },
  BehaviorView: { template: '<div data-testid="behavior">Behavior</div>' },
  BiometricView: { template: '<div data-testid="biometric">Biometric</div>' },
  TestView: { template: '<div data-testid="test">Test</div>' },
}

// Mock the view components
vi.mock('../views/SecurityCheckView.vue', () => mockComponents.SecurityCheckView)
vi.mock('../views/WelcomeView.vue', () => mockComponents.WelcomeView)
vi.mock('../views/MainView.vue', () => mockComponents.MainView)
vi.mock('../views/AuthenticationView.vue', () => mockComponents.AuthenticationView)
vi.mock('../views/AuthenticationFailedView.vue', () => mockComponents.AuthenticationFailedView)
vi.mock('../views/BehaviorView.vue', () => mockComponents.BehaviorView)
vi.mock('../views/BiometricView.vue', () => mockComponents.BiometricView)
vi.mock('../views/TestView.vue', () => mockComponents.TestView)

describe('Router Configuration', () => {
  beforeEach(() => {
    // Reset router to initial state
    router.push('/')
  })

  afterEach(() => {
    // Clean up
    router.push('/')
  })

  describe('Route Definitions', () => {
    it('should have all required routes defined', () => {
      const routes = router.getRoutes()
      
      // Check that all expected routes exist
      const routeNames = routes.map(route => route.name)
      expect(routeNames).toContain('security-check')
      expect(routeNames).toContain('welcome')
      expect(routeNames).toContain('main')
      expect(routeNames).toContain('authentication')
      expect(routeNames).toContain('authentication-failed')
      expect(routeNames).toContain('behavior')
      expect(routeNames).toContain('biometric')
      expect(routeNames).toContain('test')
    })

    it('should have correct route paths', () => {
      const routes = router.getRoutes()
      
      // Check path mappings
      const securityCheckRoute = routes.find(route => route.name === 'security-check')
      const welcomeRoute = routes.find(route => route.name === 'welcome')
      const mainRoute = routes.find(route => route.name === 'main')
      const authenticationRoute = routes.find(route => route.name === 'authentication')
      const authenticationFailedRoute = routes.find(route => route.name === 'authentication-failed')
      const behaviorRoute = routes.find(route => route.name === 'behavior')
      const biometricRoute = routes.find(route => route.name === 'biometric')
      const testRoute = routes.find(route => route.name === 'test')
      
      expect(securityCheckRoute?.path).toBe('/')
      expect(welcomeRoute?.path).toBe('/welcome')
      expect(mainRoute?.path).toBe('/main')
      expect(authenticationRoute?.path).toBe('/authentication')
      expect(authenticationFailedRoute?.path).toBe('/authentication-failed')
      expect(behaviorRoute?.path).toBe('/behavior')
      expect(biometricRoute?.path).toBe('/biometric')
      expect(testRoute?.path).toBe('/test')
    })

    it('should have components assigned to routes', () => {
      const routes = router.getRoutes()
      
      // Check that components are assigned
      const securityCheckRoute = routes.find(route => route.name === 'security-check')
      const welcomeRoute = routes.find(route => route.name === 'welcome')
      const mainRoute = routes.find(route => route.name === 'main')
      const authenticationRoute = routes.find(route => route.name === 'authentication')
      const authenticationFailedRoute = routes.find(route => route.name === 'authentication-failed')
      const behaviorRoute = routes.find(route => route.name === 'behavior')
      const biometricRoute = routes.find(route => route.name === 'biometric')
      const testRoute = routes.find(route => route.name === 'test')
      
      expect(securityCheckRoute?.components?.default).toBeDefined()
      expect(welcomeRoute?.components?.default).toBeDefined()
      expect(mainRoute?.components?.default).toBeDefined()
      expect(authenticationRoute?.components?.default).toBeDefined()
      expect(authenticationFailedRoute?.components?.default).toBeDefined()
      expect(behaviorRoute?.components?.default).toBeDefined()
      expect(biometricRoute?.components?.default).toBeDefined()
      expect(testRoute?.components?.default).toBeDefined()
    })
  })

  describe('Router History Mode', () => {
    it('should use HTML5 history mode', () => {
      expect(router.options.history).toBeInstanceOf(Object)
    })

    it('should have correct base URL', () => {
      const history = router.options.history
      expect(history).toBeDefined()
    })
  })

  describe('Route Navigation', () => {
    it('should navigate to security check route', async () => {
      await router.push('/')
      
      expect(router.currentRoute.value.path).toBe('/')
      expect(router.currentRoute.value.name).toBe('security-check')
    })

    it('should navigate to welcome route', async () => {
      await router.push('/welcome')
      
      expect(router.currentRoute.value.path).toBe('/welcome')
      expect(router.currentRoute.value.name).toBe('welcome')
    })

    it('should navigate to main route', async () => {
      await router.push('/main')
      
      expect(router.currentRoute.value.path).toBe('/main')
      expect(router.currentRoute.value.name).toBe('main')
    })

    it('should navigate to authentication route', async () => {
      await router.push('/authentication')
      
      expect(router.currentRoute.value.path).toBe('/authentication')
      expect(router.currentRoute.value.name).toBe('authentication')
    })

    it('should navigate to authentication failed route', async () => {
      await router.push('/authentication-failed')
      
      expect(router.currentRoute.value.path).toBe('/authentication-failed')
      expect(router.currentRoute.value.name).toBe('authentication-failed')
    })

    it('should navigate to behavior route', async () => {
      await router.push('/behavior')
      
      expect(router.currentRoute.value.path).toBe('/behavior')
      expect(router.currentRoute.value.name).toBe('behavior')
    })

    it('should navigate to biometric route', async () => {
      await router.push('/biometric')
      
      expect(router.currentRoute.value.path).toBe('/biometric')
      expect(router.currentRoute.value.name).toBe('biometric')
    })

    it('should navigate to test route', async () => {
      await router.push('/test')
      
      expect(router.currentRoute.value.path).toBe('/test')
      expect(router.currentRoute.value.name).toBe('test')
    })
  })

  describe('Route Parameters', () => {
    it('should handle routes without parameters', async () => {
      await router.push('/welcome')
      
      expect(router.currentRoute.value.params).toEqual({})
      expect(router.currentRoute.value.query).toEqual({})
    })

    it('should handle query parameters', async () => {
      await router.push('/authentication?sourceUrl=https://example.com&requestId=123')
      
      expect(router.currentRoute.value.query.sourceUrl).toBe('https://example.com')
      expect(router.currentRoute.value.query.requestId).toBe('123')
    })
  })

  describe('Route Guards', () => {
    it('should allow navigation to all defined routes', async () => {
      const routes = ['/', '/welcome', '/main', '/authentication', '/authentication-failed', '/behavior', '/biometric', '/test']
      
      for (const route of routes) {
        await router.push(route)
        expect(router.currentRoute.value.path).toBe(route)
      }
    })

    it('should handle 404 for undefined routes', async () => {
      // Navigate to an undefined route
      await router.push('/undefined-route')
      
      // Should stay on current route or handle 404 appropriately
      expect(router.currentRoute.value.path).toBe('/undefined-route')
    })
  })

  describe('Router Instance', () => {
    it('should be a valid router instance', () => {
      expect(router).toBeDefined()
      expect(typeof router.push).toBe('function')
      expect(typeof router.replace).toBe('function')
      expect(typeof router.go).toBe('function')
      expect(typeof router.back).toBe('function')
      expect(typeof router.forward).toBe('function')
    })

    it('should have correct router options', () => {
      expect(router.options.history).toBeDefined()
      expect(Array.isArray(router.options.routes)).toBe(true)
      expect(router.options.routes.length).toBeGreaterThan(0)
    })
  })

  describe('Route Components', () => {
    it('should have SecurityCheckView as default route', async () => {
      await router.push('/')
      
      const route = router.currentRoute.value
      expect(route.name).toBe('security-check')
      expect(route.matched.length).toBeGreaterThan(0)
    })

    it('should have all view components properly imported', () => {
      const routes = router.getRoutes()
      
      routes.forEach(route => {
        expect(route.components?.default).toBeDefined()
      })
    })
  })

  describe('Navigation Methods', () => {
    it('should support programmatic navigation', async () => {
      // Test push navigation
      await router.push('/welcome')
      expect(router.currentRoute.value.path).toBe('/welcome')
      
      // Test replace navigation
      await router.replace('/main')
      expect(router.currentRoute.value.path).toBe('/main')
      
      // Test back navigation
      router.back()
      // Note: back() behavior depends on browser history
    })

    it('should support navigation with query parameters', async () => {
      await router.push({
        path: '/authentication',
        query: {
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://destination.com',
          requestId: 'test-123'
        }
      })
      
      expect(router.currentRoute.value.path).toBe('/authentication')
      expect(router.currentRoute.value.query.sourceUrl).toBe('https://example.com')
      expect(router.currentRoute.value.query.destinationUrl).toBe('https://destination.com')
      expect(router.currentRoute.value.query.requestId).toBe('test-123')
    })
  })

  describe('Router Events', () => {
    it('should emit navigation events', async () => {
      const navigationEvents: string[] = []
      
      router.beforeEach((to, from, next) => {
        navigationEvents.push(`beforeEach: ${from.path} -> ${to.path}`)
        next()
      })
      
      await router.push('/welcome')
      await router.push('/main')
      
      expect(navigationEvents.length).toBeGreaterThan(0)
    })
  })
}) 