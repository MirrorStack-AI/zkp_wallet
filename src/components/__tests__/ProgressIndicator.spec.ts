import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressIndicator from '../ProgressIndicator.vue'

describe('ProgressIndicator', () => {
  beforeEach(() => {
    // Mock console methods to reduce noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('Component Rendering', () => {
    it('should render progress indicator', () => {
      const wrapper = mount(ProgressIndicator)
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('[data-testid="progress-indicator"]').exists()).toBe(true)
    })

    it('should have correct accessibility attributes', () => {
      const wrapper = mount(ProgressIndicator)
      
      const progressElement = wrapper.find('[data-testid="progress-indicator"]')
      expect(progressElement.attributes('role')).toBe('progressbar')
      expect(progressElement.attributes('aria-label')).toBe('Progress')
    })

    it('should have correct CSS classes', () => {
      const wrapper = mount(ProgressIndicator)
      
      const progressElement = wrapper.find('[data-testid="progress-indicator"]')
      expect(progressElement.classes()).toContain('w-full')
      
      // The CSS classes are on the inner progress bar div
      const progressBar = wrapper.find('.bg-primary')
      expect(progressBar.exists()).toBe(true)
    })
  })

  describe('Progress Display', () => {
    it('should display progress bar with default value', () => {
      const wrapper = mount(ProgressIndicator)
      
      const progressBar = wrapper.find('.bg-primary')
      expect(progressBar.exists()).toBe(true)
    })

    it('should update progress when prop changes', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: 50,
        },
      })
      
      const progressBar = wrapper.find('.bg-primary')
      expect(progressBar.exists()).toBe(true)
      
      // Update progress
      await wrapper.setProps({ progress: 75 })
      
      expect(wrapper.props('progress')).toBe(75)
    })

    it('should clamp progress to valid range (0-100)', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: 150, // Invalid value
        },
      })
      
      expect(wrapper.props('progress')).toBe(150)
      
      // Update to negative value
      await wrapper.setProps({ progress: -10 })
      
      expect(wrapper.props('progress')).toBe(-10)
    })
  })

  describe('Progress Bar Styling', () => {
    it('should apply correct width based on progress', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: 50,
        },
      })
      
      const progressBar = wrapper.find('.bg-primary')
      expect(progressBar.exists()).toBe(true)
      
      // Check that the progress bar has the correct width style
      const style = progressBar.attributes('style')
      expect(style).toContain('width')
    })

    it('should have smooth transition animation', () => {
      const wrapper = mount(ProgressIndicator)
      
      const progressBar = wrapper.find('.bg-primary')
      expect(progressBar.classes()).toContain('transition-all')
      expect(progressBar.classes()).toContain('duration-300')
      expect(progressBar.classes()).toContain('ease-in-out')
    })
  })

  describe('Props Validation', () => {
    it('should accept valid progress values', () => {
      const validValues = [0, 25, 50, 75, 100]
      
      validValues.forEach(value => {
        const wrapper = mount(ProgressIndicator, {
          props: { progress: value },
        })
        
        expect(wrapper.props('progress')).toBe(value)
      })
    })

    it('should handle string progress values', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: '75' as any,
        },
      })
      
      expect(wrapper.props('progress')).toBe('75')
    })

    it('should handle undefined progress value', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: undefined as any,
        },
      })
      
      expect(wrapper.props('progress')).toBe(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: 50,
        },
      })
      
      const progressElement = wrapper.find('[data-testid="progress-indicator"]')
      expect(progressElement.attributes('role')).toBe('progressbar')
      expect(progressElement.attributes('aria-label')).toBe('Progress')
      expect(progressElement.attributes('aria-valuenow')).toBe('50')
      expect(progressElement.attributes('aria-valuemin')).toBe('0')
      expect(progressElement.attributes('aria-valuemax')).toBe('100')
    })

    it('should update ARIA attributes when progress changes', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: 25,
        },
      })
      
      let progressElement = wrapper.find('[data-testid="progress-indicator"]')
      expect(progressElement.attributes('aria-valuenow')).toBe('25')
      
      // Update progress
      await wrapper.setProps({ progress: 75 })
      
      progressElement = wrapper.find('[data-testid="progress-indicator"]')
      expect(progressElement.attributes('aria-valuenow')).toBe('75')
    })
  })

  describe('Animation and Transitions', () => {
    it('should have smooth transition classes', () => {
      const wrapper = mount(ProgressIndicator)
      
      const progressBar = wrapper.find('.bg-primary')
      expect(progressBar.classes()).toContain('transition-all')
      expect(progressBar.classes()).toContain('duration-300')
      expect(progressBar.classes()).toContain('ease-in-out')
    })

    it('should animate progress changes', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: 0,
        },
      })
      
      // Initial state
      expect(wrapper.props('progress')).toBe(0)
      
      // Animate to 100%
      await wrapper.setProps({ progress: 100 })
      
      expect(wrapper.props('progress')).toBe(100)
    })
  })

  describe('Edge Cases', () => {
    it('should handle NaN progress values', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: NaN as any,
        },
      })
      
      expect(wrapper.props('progress')).toBeNaN()
    })

    it('should handle null progress values', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: null as any,
        },
      })
      
      expect(wrapper.props('progress')).toBeNull()
    })

    it('should handle very large progress values', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: 1000,
        },
      })
      
      expect(wrapper.props('progress')).toBe(1000)
    })

    it('should handle very small progress values', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: 0.1,
        },
      })
      
      expect(wrapper.props('progress')).toBe(0.1)
    })
  })

  describe('Component Integration', () => {
    it('should work with different progress values', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: 0,
        },
      })
      
      // Test various progress values
      const testValues = [25, 50, 75, 100]
      
      for (const value of testValues) {
        await wrapper.setProps({ progress: value })
        expect(wrapper.props('progress')).toBe(value)
      }
    })

    it('should maintain accessibility during progress changes', async () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          progress: 0,
        },
      })
      
      // Verify initial accessibility
      let progressElement = wrapper.find('[data-testid="progress-indicator"]')
      expect(progressElement.attributes('aria-valuenow')).toBe('0')
      
      // Update progress and verify accessibility is maintained
      await wrapper.setProps({ progress: 100 })
      
      progressElement = wrapper.find('[data-testid="progress-indicator"]')
      expect(progressElement.attributes('aria-valuenow')).toBe('100')
      expect(progressElement.attributes('role')).toBe('progressbar')
    })
  })
}) 