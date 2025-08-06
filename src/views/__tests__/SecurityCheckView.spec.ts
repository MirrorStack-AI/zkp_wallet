import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock the security service module BEFORE importing the component
vi.mock('@/services/security-check', () => {
  return {
    SecurityCheckOrchestrator: vi.fn().mockImplementation(() => ({
      getState: vi.fn(() => ({
        isChecking: false,
        isComplete: false,
        isSuccess: false,
        error: null as string | null,
        progress: 0,
        currentStep: null as string | null,
        results: [] as Array<{ name: string; success: boolean; details?: string }>
      })),
      startCheck: vi.fn(),
      stopCheck: vi.fn(),
      resetCheck: vi.fn()
    }))
  }
})

// Now import the component after the mock is set up
import SecurityCheckView from '../SecurityCheckView.vue'

describe('SecurityCheckView', () => {
  let wrapper: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock global objects
    global.window = {
      ...global.window,
      chrome: { sendMessage: vi.fn() },
      MirrorStackWallet: { sendMessage: vi.fn() }
    } as any

    // Mock setTimeout
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    return mount(SecurityCheckView, {
      props: {
        ...props
      },
      global: {
        stubs: {
          'ContainerMain': true,
          'ThemeToggle': true,
          'ProgressIndicator': true
        }
      }
    })
  }

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      wrapper = createWrapper()
      
      // Just check if the component mounts without errors
      expect(wrapper.exists()).toBe(true)
    })

    it('has the correct root element', () => {
      wrapper = createWrapper()
      
      // Check if the root element exists
      const rootElement = wrapper.find('[data-testid="security-check-view"]')
      expect(rootElement.exists()).toBe(true)
    })
  })
}) 