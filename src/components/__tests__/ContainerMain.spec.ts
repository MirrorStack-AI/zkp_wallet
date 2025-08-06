import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ContainerMain from '../ContainerMain.vue'

// Mock ThemeToggle component
vi.mock('../ThemeToggle.vue', () => ({
  default: {
    name: 'ThemeToggle',
    template: '<div data-testid="theme-toggle">Theme Toggle</div>',
  },
}))

describe('ContainerMain', () => {
  beforeEach(() => {
    // Mock console.warn to avoid noise in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('Props and Computed Properties', () => {
    it('should render with default props', () => {
      const wrapper = mount(ContainerMain)
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('main').exists()).toBe(true)
      expect(wrapper.find('[data-testid="theme-toggle"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="settings-icon"]').exists()).toBe(false)
    })

    it('should apply correct maxHeight style with valid prop', () => {
      const wrapper = mount(ContainerMain, {
        props: {
          maxHeight: 600,
        },
      })

      const mainElement = wrapper.find('main')
      expect(mainElement.attributes('style')).toContain('max-height: 600px')
      expect(mainElement.attributes('style')).toContain('min-height: 600px')
    })

    it('should clamp maxHeight to minimum value (100px)', () => {
      const wrapper = mount(ContainerMain, {
        props: {
          maxHeight: 50,
        },
      })

      const mainElement = wrapper.find('main')
      expect(mainElement.attributes('style')).toContain('max-height: 100px')
      expect(mainElement.attributes('style')).toContain('min-height: 100px')
    })

    it('should clamp maxHeight to maximum value (2000px)', () => {
      const wrapper = mount(ContainerMain, {
        props: {
          maxHeight: 2500,
        },
      })

      const mainElement = wrapper.find('main')
      expect(mainElement.attributes('style')).toContain('max-height: 2000px')
      expect(mainElement.attributes('style')).toContain('min-height: 2000px')
    })

    it('should handle invalid maxHeight values', () => {
      const wrapper = mount(ContainerMain, {
        props: {
          maxHeight: NaN,
        },
      })

      const mainElement = wrapper.find('main')
      expect(mainElement.attributes('style')).toContain('max-height: 500px')
      expect(mainElement.attributes('style')).toContain('min-height: 500px')
    })

    it('should handle string maxHeight values', () => {
      const wrapper = mount(ContainerMain, {
        props: {
          maxHeight: '600' as any,
        },
      })

      const mainElement = wrapper.find('main')
      expect(mainElement.attributes('style')).toContain('max-height: 500px')
      expect(mainElement.attributes('style')).toContain('min-height: 500px')
    })
  })

  describe('Settings Button', () => {
    it('should show settings button when showSettings is true', () => {
      const wrapper = mount(ContainerMain, {
        props: {
          showSettings: true,
        },
      })

      expect(wrapper.find('[data-testid="settings-icon"]').exists()).toBe(true)
    })

    it('should not show settings button when showSettings is false', () => {
      const wrapper = mount(ContainerMain, {
        props: {
          showSettings: false,
        },
      })

      expect(wrapper.find('[data-testid="settings-icon"]').exists()).toBe(false)
    })

    it('should emit navigate-to-settings event when settings button is clicked', async () => {
      const wrapper = mount(ContainerMain, {
        props: {
          showSettings: true,
        },
      })

      const settingsButton = wrapper.find('[data-testid="settings-icon"]')
      await settingsButton.trigger('click')

      expect(wrapper.emitted('navigate-to-settings')).toBeTruthy()
      expect(wrapper.emitted('navigate-to-settings')).toHaveLength(1)
    })
  })

  describe('Theme Toggle', () => {
    it('should always render theme toggle', () => {
      const wrapper = mount(ContainerMain)
      
      expect(wrapper.find('[data-testid="theme-toggle"]').exists()).toBe(true)
    })

    it('should render theme toggle in correct position', () => {
      const wrapper = mount(ContainerMain)
      
      const themeToggleContainer = wrapper.find('.absolute.top-4.right-4')
      expect(themeToggleContainer.exists()).toBe(true)
      expect(themeToggleContainer.find('[data-testid="theme-toggle"]').exists()).toBe(true)
    })
  })

  describe('Slot Content', () => {
    it('should render slot content', () => {
      const wrapper = mount(ContainerMain, {
        slots: {
          default: '<div data-testid="slot-content">Test Content</div>',
        },
      })

      expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="slot-content"]').text()).toBe('Test Content')
    })
  })

  describe('CSS Classes', () => {
    it('should apply correct CSS classes to main element', () => {
      const wrapper = mount(ContainerMain)
      
      const mainElement = wrapper.find('main')
      expect(mainElement.classes()).toContain('bg-surface')
      expect(mainElement.classes()).toContain('w-full')
      expect(mainElement.classes()).toContain('p-6')
      expect(mainElement.classes()).toContain('flex')
      expect(mainElement.classes()).toContain('flex-col')
      expect(mainElement.classes()).toContain('items-center')
      expect(mainElement.classes()).toContain('justify-center')
      expect(mainElement.classes()).toContain('gap-4')
      expect(mainElement.classes()).toContain('h-full')
      expect(mainElement.classes()).toContain('relative')
    })

    it('should apply correct CSS classes to settings button', () => {
      const wrapper = mount(ContainerMain, {
        props: {
          showSettings: true,
        },
      })

      const settingsButton = wrapper.find('[data-testid="settings-icon"]')
      expect(settingsButton.classes()).toContain('w-10')
      expect(settingsButton.classes()).toContain('h-10')
      expect(settingsButton.classes()).toContain('bg-surface-container')
      expect(settingsButton.classes()).toContain('rounded-[22px]')
      expect(settingsButton.classes()).toContain('flex')
      expect(settingsButton.classes()).toContain('items-center')
      expect(settingsButton.classes()).toContain('justify-center')
      expect(settingsButton.classes()).toContain('transition-all')
      expect(settingsButton.classes()).toContain('duration-300')
      expect(settingsButton.classes()).toContain('hover:bg-surface-variant')
      expect(settingsButton.classes()).toContain('z-10')
    })
  })

  describe('Console Warnings', () => {
    it('should log warning for invalid maxHeight value', () => {
      mount(ContainerMain, {
        props: {
          maxHeight: NaN,
        },
      })

      expect(console.warn).toHaveBeenCalledWith(
        'ContainerMain: Invalid maxHeight value provided, using 500'
      )
    })
  })

  describe('Component Integration', () => {
    it('should work with both settings and theme toggle visible', () => {
      const wrapper = mount(ContainerMain, {
        props: {
          showSettings: true,
          maxHeight: 800,
        },
        slots: {
          default: '<div>Content</div>',
        },
      })

      expect(wrapper.find('[data-testid="settings-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="theme-toggle"]').exists()).toBe(true)
      expect(wrapper.find('main').attributes('style')).toContain('max-height: 800px')
    })
  })
}) 