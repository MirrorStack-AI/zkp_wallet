import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IconLogo from '../IconLogo.vue'

describe('IconLogo Component', () => {
  describe('Component Rendering', () => {
    it('should render with default props', () => {
      const wrapper = mount(IconLogo)
      
      const svg = wrapper.find('svg')
      expect(svg.exists()).toBe(true)
      expect(svg.attributes('viewBox')).toBe('0 0 96 97')
      expect(svg.attributes('fill')).toBe('currentColor')
    })

    it('should apply custom class', () => {
      const wrapper = mount(IconLogo, {
        props: {
          class: 'custom-class'
        }
      })
      
      expect(wrapper.classes()).toContain('custom-class')
    })

    it('should apply custom width and height', () => {
      const wrapper = mount(IconLogo, {
        props: {
          width: '48',
          height: '48'
        }
      })
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('width')).toBe('48')
      expect(svg.attributes('height')).toBe('48')
    })
  })

  describe('SVG Structure', () => {
    it('should have correct SVG structure', () => {
      const wrapper = mount(IconLogo)
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('viewBox')).toBe('0 0 96 97')
      expect(svg.attributes('xmlns')).toBe('http://www.w3.org/2000/svg')
      
      // Check for path elements
      const paths = wrapper.findAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('should have proper fill attribute', () => {
      const wrapper = mount(IconLogo)
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('fill')).toBe('currentColor')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const wrapper = mount(IconLogo, {
        attrs: {
          'aria-label': 'Logo'
        }
      })
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('aria-label')).toBe('Logo')
    })

    it('should be focusable when needed', () => {
      const wrapper = mount(IconLogo, {
        attrs: {
          tabindex: '0'
        }
      })
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('tabindex')).toBe('0')
    })
  })

  describe('Styling', () => {
    it('should apply custom styles', () => {
      const wrapper = mount(IconLogo, {
        attrs: {
          style: 'color: red;'
        }
      })
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('style')).toContain('color: red')
    })

    it('should inherit color from parent', () => {
      const wrapper = mount(IconLogo)
      
      const svg = wrapper.find('svg')
      expect(svg.attributes('fill')).toBe('currentColor')
    })
  })
}) 