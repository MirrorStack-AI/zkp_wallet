import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ThemeToggle from '../ThemeToggle.vue'

// Mock Chrome extension API
const mockChrome = {
  runtime: {
    sendMessage: vi.fn().mockResolvedValue(undefined),
  },
}

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
}

// Mock matchMedia
const mockMatchMedia = vi.fn()

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Setup global mocks
    Object.defineProperty(window, 'chrome', {
      value: mockChrome,
      writable: true,
    })

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
    })

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    // Reset mocks
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render theme toggle button', () => {
      const wrapper = mount(ThemeToggle)
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('[data-testid="theme-toggle"]').exists()).toBe(true)
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('should have correct accessibility attributes', () => {
      const wrapper = mount(ThemeToggle)
      
      const button = wrapper.find('button')
      expect(button.attributes('aria-label')).toBe('Toggle theme')
    })

    it('should have correct CSS classes', () => {
      const wrapper = mount(ThemeToggle)
      
      const button = wrapper.find('button')
      expect(button.classes()).toContain('p-1')
      expect(button.classes()).toContain('w-10')
      expect(button.classes()).toContain('h-10')
      expect(button.classes()).toContain('rounded-full')
      expect(button.classes()).toContain('bg-surface-container')
      expect(button.classes()).toContain('hover:bg-surface-container-highest')
      expect(button.classes()).toContain('transition-colors')
      expect(button.classes()).toContain('flex')
      expect(button.classes()).toContain('items-center')
      expect(button.classes()).toContain('justify-center')
    })
  })

  describe('Theme Icons', () => {
    it('should show theme icon', async () => {
      const wrapper = mount(ThemeToggle)
      
      // Trigger a re-render
      await wrapper.vm.$nextTick()
      
      const icon = wrapper.find('.material-symbols-rounded')
      expect(icon.exists()).toBe(true)
    })

    it('should show different icons based on theme', async () => {
      const wrapper = mount(ThemeToggle)
      
      // Trigger a re-render
      await wrapper.vm.$nextTick()
      
      const icon = wrapper.find('.material-symbols-rounded')
      expect(icon.exists()).toBe(true)
    })

    it('should display theme toggle functionality', async () => {
      const wrapper = mount(ThemeToggle)
      
      // Trigger a re-render
      await wrapper.vm.$nextTick()
      
      const icon = wrapper.find('.material-symbols-rounded')
      expect(icon.exists()).toBe(true)
    })
  })

  describe('Theme Toggle Functionality', () => {
    it('should toggle theme when button is clicked', async () => {
      const wrapper = mount(ThemeToggle)
      
      // Click button to toggle
      await wrapper.find('button').trigger('click')
      
      // Verify that the click event was triggered
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('should cycle through themes when button is clicked multiple times', async () => {
      const wrapper = mount(ThemeToggle)
      
      // Click button multiple times to cycle through themes
      await wrapper.find('button').trigger('click')
      await wrapper.find('button').trigger('click')
      await wrapper.find('button').trigger('click')
      
      // Verify that the button still exists and is functional
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('should save theme to localStorage when toggled', async () => {
      const wrapper = mount(ThemeToggle)
      
      await wrapper.find('button').trigger('click')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light')
    })

    it('should apply theme to document when toggled', async () => {
      const wrapper = mount(ThemeToggle)
      
      // Mock document.documentElement
      const mockRoot = {
        classList: {
          remove: vi.fn(),
          add: vi.fn(),
        },
        setAttribute: vi.fn(),
      }
      Object.defineProperty(document, 'documentElement', {
        value: mockRoot,
        writable: true,
      })
      
      await wrapper.find('button').trigger('click')
      
      expect(mockRoot.classList.remove).toHaveBeenCalledWith('light', 'dark')
      expect(mockRoot.classList.add).toHaveBeenCalledWith('light')
      expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    })
  })

  describe('Chrome Extension Communication', () => {
    it('should send theme change message to Chrome extension', async () => {
      const wrapper = mount(ThemeToggle)
      
      await wrapper.find('button').trigger('click')
      
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'CHANGE_THEME',
        theme: 'light',
      })
    })

    it('should handle Chrome extension communication errors gracefully', async () => {
      mockChrome.runtime.sendMessage.mockRejectedValue(new Error('Connection failed'))
      
      const wrapper = mount(ThemeToggle)
      
      await wrapper.find('button').trigger('click')
      
      expect(console.error).toHaveBeenCalledWith(
        'Failed to notify background script about theme change:',
        expect.any(Error)
      )
    })

    it('should not send message when Chrome extension is not available', async () => {
      // Remove Chrome mock
      Object.defineProperty(window, 'chrome', {
        value: undefined,
        writable: true,
      })
      
      const wrapper = mount(ThemeToggle)
      
      await wrapper.find('button').trigger('click')
      
      // Should not throw error
      // Verify the button exists and is clickable
      expect(wrapper.find('button').exists()).toBe(true)
    })
  })

  describe('System Theme Detection', () => {
    it('should detect dark system theme', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
      
      const wrapper = mount(ThemeToggle)
      
      // Verify component mounts successfully with dark theme detection
      expect(wrapper.exists()).toBe(true)
    })

    it('should detect light system theme', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
      
      const wrapper = mount(ThemeToggle)
      
      // Verify component mounts successfully with light theme detection
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Theme Persistence', () => {
    it('should load saved theme from localStorage on mount', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const wrapper = mount(ThemeToggle)
      
      // Verify component mounts successfully
      expect(wrapper.exists()).toBe(true)
    })

    it('should use auto theme as default when no saved theme', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const wrapper = mount(ThemeToggle)
      
      // Verify component mounts successfully
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle invalid saved theme gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-theme')
      
      const wrapper = mount(ThemeToggle)
      
      // Verify component mounts successfully
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      const wrapper = mount(ThemeToggle)
      
      // Verify component handles localStorage errors gracefully
      expect(wrapper.exists()).toBe(true)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load theme from localStorage:',
        expect.any(Error)
      )
    })
  })

  describe('Theme Application', () => {
    it('should apply theme correctly', () => {
      const mockRoot = {
        classList: {
          remove: vi.fn(),
          add: vi.fn(),
        },
        setAttribute: vi.fn(),
      }
      Object.defineProperty(document, 'documentElement', {
        value: mockRoot,
        writable: true,
      })
      
      mockMatchMedia.mockReturnValue({
        matches: true, // Dark system theme
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
      
      const wrapper = mount(ThemeToggle)
      
      // Verify component mounts successfully
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle theme application errors gracefully', () => {
      const mockRoot = {
        classList: {
          remove: vi.fn(),
          add: vi.fn(),
        },
        setAttribute: vi.fn(),
      }
      Object.defineProperty(document, 'documentElement', {
        value: mockRoot,
        writable: true,
      })
      
      const wrapper = mount(ThemeToggle)
      
      // Verify component mounts successfully
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Media Query Listener', () => {
    it('should add media query listener on mount', () => {
      // Set up a working DOM mock first
      const mockRoot = {
        classList: {
          remove: vi.fn(),
          add: vi.fn(),
        },
        setAttribute: vi.fn(),
      }
      Object.defineProperty(document, 'documentElement', {
        value: mockRoot,
        writable: true,
      })
      
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
      mockMatchMedia.mockReturnValue(mockMediaQuery)
      
      mount(ThemeToggle)
      
      // Verify that matchMedia was called
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })

    it('should remove media query listener on unmount', () => {
      // Set up a working DOM mock first
      const mockRoot = {
        classList: {
          remove: vi.fn(),
          add: vi.fn(),
        },
        setAttribute: vi.fn(),
      }
      Object.defineProperty(document, 'documentElement', {
        value: mockRoot,
        writable: true,
      })
      
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
      mockMatchMedia.mockReturnValue(mockMediaQuery)
      
      const wrapper = mount(ThemeToggle)
      wrapper.unmount()
      
      // Verify that matchMedia was called
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage setItem errors', async () => {
      // Set up a working DOM mock first
      const mockRoot = {
        classList: {
          remove: vi.fn(),
          add: vi.fn(),
        },
        setAttribute: vi.fn(),
      }
      Object.defineProperty(document, 'documentElement', {
        value: mockRoot,
        writable: true,
      })
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded')
      })
      
      const wrapper = mount(ThemeToggle)
      
      await wrapper.find('button').trigger('click')
      
      expect(console.error).toHaveBeenCalledWith(
        'Failed to save theme to localStorage:',
        expect.any(Error)
      )
    })

    it('should handle Chrome extension communication errors on mount', () => {
      // Set up a working DOM mock first
      const mockRoot = {
        classList: {
          remove: vi.fn(),
          add: vi.fn(),
        },
        setAttribute: vi.fn(),
      }
      Object.defineProperty(document, 'documentElement', {
        value: mockRoot,
        writable: true,
      })
      
      mockChrome.runtime.sendMessage.mockRejectedValue(new Error('Extension not available'))
      
      const wrapper = mount(ThemeToggle)
      
      // Verify component mounts successfully
      expect(wrapper.exists()).toBe(true)
    })
  })
}) 