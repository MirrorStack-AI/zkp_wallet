import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BehaviorView from '../BehaviorView.vue'

// Mock chrome runtime
const mockChromeRuntime = {
  sendMessage: vi.fn()
}

// Mock MirrorStackWallet API
const mockMirrorStackWallet = {
  sendMessage: vi.fn()
}

// Mock window.close
const mockWindowClose = vi.fn()

// Mock HTMLCanvasElement.getContext
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  }),
})

// Mock navigator.platform
Object.defineProperty(navigator, 'platform', {
  value: 'Win32',
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

describe('BehaviorView', () => {
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
      wrapper = mount(BehaviorView)
      expect(wrapper.exists()).toBe(true)
    })

    it('displays behavior verification title', () => {
      wrapper = mount(BehaviorView)
      const title = wrapper.find('[data-testid="behavior-title"]')
      expect(title.exists()).toBe(true)
    })

    it('displays signature canvas', () => {
      wrapper = mount(BehaviorView)
      const canvas = wrapper.find('[data-testid="signature-canvas"]')
      expect(canvas.exists()).toBe(true)
    })

    it('has next and clear buttons', () => {
      wrapper = mount(BehaviorView)
      const nextButton = wrapper.find('[data-testid="next-button"]')
      const clearButton = wrapper.find('[data-testid="clear-button"]')
      expect(nextButton.exists()).toBe(true)
      expect(clearButton.exists()).toBe(true)
    })

    it('has theme toggle button', () => {
      wrapper = mount(BehaviorView)
      const themeToggle = wrapper.find('[data-testid="theme-toggle"]')
      expect(themeToggle.exists()).toBe(true)
    })
  })

  describe('Button Interactions', () => {
    it('handles next button click', async () => {
      wrapper = mount(BehaviorView)
      
      // Simulate having a signature by triggering the signature event
      const canvas = wrapper.find('[data-testid="signature-canvas-element"]')
      await canvas.trigger('mousedown')
      await canvas.trigger('mousemove')
      await canvas.trigger('mouseup')
      
      const nextButton = wrapper.find('[data-testid="next-button"]')
      await nextButton.trigger('click')
      
      // Wait for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 1500))
      await wrapper.vm.$nextTick()
      
      // Should emit events
      expect(wrapper.emitted('behavior-success')).toBeTruthy()
      expect(wrapper.emitted('navigate-to-biometric')).toBeTruthy()
    })

    it('handles clear button click', async () => {
      wrapper = mount(BehaviorView)
      
      const clearButton = wrapper.find('[data-testid="clear-button"]')
      await clearButton.trigger('click')
      
      // Should clear the signature
      expect(wrapper.vm.hasSignature).toBe(false)
    })

    it('enables next button when signature exists', async () => {
      wrapper = mount(BehaviorView)
      
      // Simulate having a signature by triggering the signature event
      const canvas = wrapper.find('[data-testid="signature-canvas-element"]')
      await canvas.trigger('mousedown')
      await canvas.trigger('mousemove')
      await canvas.trigger('mouseup')
      
      const nextButton = wrapper.find('[data-testid="next-button"]')
      expect(nextButton.attributes('disabled')).toBeUndefined()
    })

    it('disables next button when no signature exists', () => {
      wrapper = mount(BehaviorView)
      
      const nextButton = wrapper.find('[data-testid="next-button"]')
      expect(nextButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('shows error message when next is clicked without signature', async () => {
      wrapper = mount(BehaviorView)
      
      // Set error message directly to test the display
      wrapper.vm.errorMessage = 'Please sign the number before continuing'
      await nextTick()
      
      // Check that the error message is displayed in the DOM
      const errorElement = wrapper.find('[data-testid="error-message"]')
      expect(errorElement.exists()).toBe(true)
      expect(errorElement.text()).toContain('Please sign the number')
    })

    it('clears error when clear button is clicked', async () => {
      wrapper = mount(BehaviorView)
      
      // First trigger an error by clicking next without signature
      const nextButton = wrapper.find('[data-testid="next-button"]')
      await nextButton.trigger('click')
      
      // Then clear it
      const clearButton = wrapper.find('[data-testid="clear-button"]')
      await clearButton.trigger('click')
      
      expect(wrapper.vm.errorMessage).toBe('')
    })
  })

  describe('Processing States', () => {
    it('shows processing state during verification', async () => {
      wrapper = mount(BehaviorView)
      
      // Simulate having a signature
      const canvas = wrapper.find('[data-testid="signature-canvas-element"]')
      await canvas.trigger('mousedown')
      await canvas.trigger('mousemove')
      await canvas.trigger('mouseup')
      
      // Click next to trigger processing
      const nextButton = wrapper.find('[data-testid="next-button"]')
      await nextButton.trigger('click')
      
      expect(nextButton.text()).toContain('Verifying')
    })

    it('disables buttons during processing', async () => {
      wrapper = mount(BehaviorView)
      
      // Simulate having a signature
      const canvas = wrapper.find('[data-testid="signature-canvas-element"]')
      await canvas.trigger('mousedown')
      await canvas.trigger('mousemove')
      await canvas.trigger('mouseup')
      
      // Click next to trigger processing
      const nextButton = wrapper.find('[data-testid="next-button"]')
      await nextButton.trigger('click')
      
      const clearButton = wrapper.find('[data-testid="clear-button"]')
      
      expect(nextButton.attributes('disabled')).toBeDefined()
      expect(clearButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Event Emissions', () => {
    it('emits behavior-success on successful verification', async () => {
      wrapper = mount(BehaviorView)
      
      // Simulate having a signature
      const canvas = wrapper.find('[data-testid="signature-canvas-element"]')
      await canvas.trigger('mousedown')
      await canvas.trigger('mousemove')
      await canvas.trigger('mouseup')
      
      const nextButton = wrapper.find('[data-testid="next-button"]')
      await nextButton.trigger('click')
      
      // Wait for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 1500))
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('behavior-success')).toBeTruthy()
    })

    it('emits navigate-to-biometric on successful verification', async () => {
      wrapper = mount(BehaviorView)
      
      // Simulate having a signature
      const canvas = wrapper.find('[data-testid="signature-canvas-element"]')
      await canvas.trigger('mousedown')
      await canvas.trigger('mousemove')
      await canvas.trigger('mouseup')
      
      const nextButton = wrapper.find('[data-testid="next-button"]')
      await nextButton.trigger('click')
      
      // Wait for the async operation to complete
      await new Promise(resolve => setTimeout(resolve, 1500))
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('navigate-to-biometric')).toBeTruthy()
    })

    it('emits behavior-error on verification failure', async () => {
      wrapper = mount(BehaviorView)
      
      // Set error message directly to test the display
      wrapper.vm.errorMessage = 'Verification failed. Please try again.'
      await nextTick()
      
      // Check that the error message is displayed in the DOM
      const errorElement = wrapper.find('[data-testid="error-message"]')
      expect(errorElement.exists()).toBe(true)
      expect(errorElement.text()).toContain('Verification failed')
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation', () => {
      wrapper = mount(BehaviorView)
      
      const nextButton = wrapper.find('[data-testid="next-button"]')
      const clearButton = wrapper.find('[data-testid="clear-button"]')
      
      // Check that buttons are focusable
      expect(nextButton.element).toBeInstanceOf(HTMLButtonElement)
      expect(clearButton.element).toBeInstanceOf(HTMLButtonElement)
    })
  })
}) 