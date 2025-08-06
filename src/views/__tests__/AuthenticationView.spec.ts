import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthenticationView from '../AuthenticationView.vue'

// Mock the services
vi.mock('@/services/AuthenticationService', () => ({
  default: {
    getInstance: vi.fn(() => ({
      authorizeRequest: vi.fn().mockResolvedValue('test-request-123'),
      clearAuthenticationStatus: vi.fn().mockResolvedValue(undefined)
    }))
  }
}))

vi.mock('@/services/TimeoutService', () => ({
  default: {
    getInstance: vi.fn(() => ({
      startTimeout: vi.fn(),
      stopTimeout: vi.fn(),
      clearTimeout: vi.fn(),
      getTimeLeft: vi.fn().mockReturnValue(30)
    }))
  }
}))

vi.mock('@/services/ExtensionCommunicationService', () => ({
  default: {
    getInstance: vi.fn(() => ({
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }))
  }
}))

// Mock Chrome extension API
const mockChrome = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    sendMessage: vi.fn().mockResolvedValue(undefined),
  },
}

Object.defineProperty(window, 'chrome', {
  value: mockChrome,
  writable: true,
})

// Mock window.matchMedia for ThemeToggle component
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
})

describe('AuthenticationView', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Rendering', () => {
    it('renders correctly with default props', () => {
      wrapper = mount(AuthenticationView, {
        props: {
          requestId: 'test-request-123',
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://destination.com',
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('displays source and destination URLs', () => {
      wrapper = mount(AuthenticationView, {
        props: {
          requestId: 'test-request-123',
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://destination.com',
        },
      })

      expect(wrapper.text()).toContain('example.com')
      expect(wrapper.text()).toContain('destination.com')
    })

    it('shows loading state when authorize button is clicked', async () => {
      wrapper = mount(AuthenticationView, {
        props: {
          requestId: 'test-request-123',
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://destination.com',
        },
      })

      const authorizeButton = wrapper.find('[data-testid="authorize-button"]')
      await authorizeButton.trigger('click')

      expect(wrapper.vm.isProcessing).toBe(true)
    })

    it('emits authorize-success event on successful authorization', async () => {
      wrapper = mount(AuthenticationView, {
        props: {
          requestId: 'test-request-123',
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://destination.com',
        },
      })

      const authorizeButton = wrapper.find('[data-testid="authorize-button"]')
      await authorizeButton.trigger('click')

      // Wait for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 1500))
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('authorize-success')).toBeTruthy()
    })

    it('emits cancel event when cancel button is clicked', async () => {
      wrapper = mount(AuthenticationView, {
        props: {
          requestId: 'test-request-123',
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://destination.com',
        },
      })

      const cancelButton = wrapper.find('[data-testid="cancel-button"]')
      await cancelButton.trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('displays error message when authorization fails', async () => {
      wrapper = mount(AuthenticationView, {
        props: {
          requestId: 'test-request-123',
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://destination.com',
        },
      })

      // Set error message directly to test the display
      wrapper.vm.errorMessage = 'Authorization failed. Please try again.'
      await wrapper.vm.$nextTick()

      // Check that the error message is displayed in the DOM
      const errorMessage = wrapper.find('[data-testid="error-message"]')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('Authorization failed')
    })

    it('has theme toggle button', () => {
      wrapper = mount(AuthenticationView, {
        props: {
          requestId: 'test-request-123',
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://destination.com',
        },
      })

      const themeToggle = wrapper.find('[data-testid="theme-toggle"]')
      expect(themeToggle.exists()).toBe(true)
    })

    it('handles theme toggle click', async () => {
      wrapper = mount(AuthenticationView, {
        props: {
          requestId: 'test-request-123',
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://destination.com',
        },
      })

      const themeToggle = wrapper.find('[data-testid="theme-toggle"]')
      await themeToggle.trigger('click')

      // Theme toggle should work without errors
      expect(themeToggle.exists()).toBe(true)
    })

    it('disables buttons during loading state', async () => {
      wrapper = mount(AuthenticationView, {
        props: {
          requestId: 'test-request-123',
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://destination.com',
        },
      })

      // Set loading state
      wrapper.vm.isProcessing = true
      await wrapper.vm.$nextTick()

      const authorizeButton = wrapper.find('[data-testid="authorize-button"]')
      const cancelButton = wrapper.find('[data-testid="cancel-button"]')

      expect(authorizeButton.attributes('disabled')).toBeDefined()
      expect(cancelButton.attributes('disabled')).toBeDefined()
    })

    it('accepts custom props', () => {
      wrapper = mount(AuthenticationView, {
        props: {
          requestId: 'custom-request-id',
          sourceUrl: 'https://custom-source.com',
          destinationUrl: 'https://custom-destination.com',
        },
      })

      expect(wrapper.props('requestId')).toBe('custom-request-id')
      expect(wrapper.props('sourceUrl')).toBe('https://custom-source.com')
      expect(wrapper.props('destinationUrl')).toBe('https://custom-destination.com')
    })
  })
}) 