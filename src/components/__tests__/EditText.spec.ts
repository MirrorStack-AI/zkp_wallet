import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EditText from '../EditText.vue'

describe('EditText', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = null
  })

  const createWrapper = (props = {}) => {
    return mount(EditText, {
      props: {
        modelValue: '',
        label: 'Test Label',
        ...props
      }
    })
  }

  describe('Basic Rendering', () => {
    it('renders input with correct label', () => {
      wrapper = createWrapper()
      expect(wrapper.find('label').text()).toBe('Test Label')
      expect(wrapper.find('input').exists()).toBe(true)
    })

    it('renders textarea when textarea prop is true', () => {
      wrapper = createWrapper({ textarea: true })
      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(wrapper.find('input').exists()).toBe(false)
    })

    it('applies correct input type', () => {
      wrapper = createWrapper({ type: 'email' })
      expect(wrapper.find('input').attributes('type')).toBe('email')
    })

    it('applies correct placeholder', () => {
      wrapper = createWrapper({ placeholder: 'Enter text here' })
      expect(wrapper.find('input').attributes('placeholder')).toBe('Enter text here')
    })
  })

  describe('Password Input', () => {
    it('renders password toggle button for password type', () => {
      wrapper = createWrapper({ type: 'password' })
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('does not render password toggle for non-password types', () => {
      wrapper = createWrapper({ type: 'text' })
      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('does not render password toggle for textarea', () => {
      wrapper = createWrapper({ type: 'password', textarea: true })
      expect(wrapper.find('button').exists()).toBe(false)
    })

    it('toggles password visibility when button is clicked', async () => {
      wrapper = createWrapper({ type: 'password' })
      const input = wrapper.find('input')
      const button = wrapper.find('button')

      // Initially password type
      expect(input.attributes('type')).toBe('password')

      // Click to show password
      await button.trigger('click')
      await nextTick()
      expect(input.attributes('type')).toBe('text')

      // Click to hide password
      await button.trigger('click')
      await nextTick()
      expect(input.attributes('type')).toBe('password')
    })

    it('shows correct eye icons for password visibility', async () => {
      wrapper = createWrapper({ type: 'password' })
      const button = wrapper.find('button')

      // Initially shows eye icon (password hidden)
      expect(wrapper.find('svg').exists()).toBe(true)

      // Click to show password
      await button.trigger('click')
      await nextTick()
      // Button should still exist after toggle
      expect(button.exists()).toBe(true)
    })
  })

  describe('Error States', () => {
    it('applies error styling when errorMessage is provided', () => {
      wrapper = createWrapper({ errorMessage: 'This field is required' })
      const container = wrapper.find('.border-error')
      expect(container.exists()).toBe(true)
    })

    it('shows error message when provided', () => {
      wrapper = createWrapper({ errorMessage: 'This field is required' })
      expect(wrapper.text()).toContain('This field is required')
    })

    it('does not show error message when showError is false', () => {
      wrapper = createWrapper({ 
        errorMessage: 'This field is required',
        showError: false
      })
      expect(wrapper.text()).not.toContain('This field is required')
    })

    it('applies error styling to label when error exists', () => {
      wrapper = createWrapper({ errorMessage: 'Error message' })
      const label = wrapper.find('label')
      expect(label.classes()).toContain('text-error')
    })
  })

  describe('Helper Text', () => {
    it('shows helper text when provided', () => {
      wrapper = createWrapper({ helperText: 'This is helper text' })
      expect(wrapper.text()).toContain('This is helper text')
    })

    it('does not show helper text when not provided', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).not.toContain('This is helper text')
    })
  })

  describe('Input Attributes', () => {
    it('applies required attribute', () => {
      wrapper = createWrapper({ required: true })
      expect(wrapper.find('input').attributes('required')).toBeDefined()
    })

    it('applies disabled attribute', () => {
      wrapper = createWrapper({ disabled: true })
      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })

    it('applies minlength attribute', () => {
      wrapper = createWrapper({ minlength: 5 })
      expect(wrapper.find('input').attributes('minlength')).toBe('5')
    })

    it('applies maxlength attribute', () => {
      wrapper = createWrapper({ maxlength: 100 })
      expect(wrapper.find('input').attributes('maxlength')).toBe('100')
    })

    it('applies rows attribute to textarea', () => {
      wrapper = createWrapper({ textarea: true, rows: 5 })
      expect(wrapper.find('textarea').attributes('rows')).toBe('5')
    })
  })

  describe('Event Handling', () => {
    it('emits update:modelValue when input changes', async () => {
      wrapper = createWrapper()
      const input = wrapper.find('input')
      
      await input.setValue('test value')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['test value'])
    })

    it('emits focus event', async () => {
      wrapper = createWrapper()
      const input = wrapper.find('input')
      
      await input.trigger('focus')
      expect(wrapper.emitted('focus')).toBeTruthy()
    })

    it('emits blur event', async () => {
      wrapper = createWrapper()
      const input = wrapper.find('input')
      
      await input.trigger('blur')
      expect(wrapper.emitted('blur')).toBeTruthy()
    })

    it('emits keyup event', async () => {
      wrapper = createWrapper()
      const input = wrapper.find('input')
      
      await input.trigger('keyup')
      expect(wrapper.emitted('keyup')).toBeTruthy()
    })

    it('emits keydown event', async () => {
      wrapper = createWrapper()
      const input = wrapper.find('input')
      
      await input.trigger('keydown')
      expect(wrapper.emitted('keydown')).toBeTruthy()
    })
  })

  describe('Textarea Specific', () => {
    it('emits update:modelValue for textarea', async () => {
      wrapper = createWrapper({ textarea: true })
      const textarea = wrapper.find('textarea')
      
      await textarea.setValue('textarea value')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['textarea value'])
    })

    it('applies correct rows to textarea', () => {
      wrapper = createWrapper({ textarea: true, rows: 4 })
      expect(wrapper.find('textarea').attributes('rows')).toBe('4')
    })
  })

  describe('Focus Only Placeholder', () => {
    it('shows placeholder only when focused', async () => {
      wrapper = createWrapper({ 
        placeholder: 'Enter text',
        focusOnlyPlaceholder: true
      })
      const input = wrapper.find('input')
      
      // Initially no placeholder
      expect(input.attributes('placeholder')).toBe('')
      
      // After focus, placeholder appears
      await input.trigger('focus')
      await nextTick()
      expect(input.attributes('placeholder')).toBe('Enter text')
      
      // After blur, placeholder disappears
      await input.trigger('blur')
      await nextTick()
      expect(input.attributes('placeholder')).toBe('')
    })
  })

  describe('ID Generation', () => {
    it('uses provided id when available', () => {
      wrapper = createWrapper({ id: 'custom-id' })
      expect(wrapper.find('input').attributes('id')).toBe('custom-id')
      expect(wrapper.find('label').attributes('for')).toBe('custom-id')
    })

    it('generates unique id when not provided', () => {
      wrapper = createWrapper()
      const input = wrapper.find('input')
      const label = wrapper.find('label')
      
      const inputId = input.attributes('id')
      expect(inputId).toBeDefined()
      expect(inputId).toMatch(/^edittext-/)
      expect(label.attributes('for')).toBe(inputId)
    })
  })

  describe('Label Animation', () => {
    it('applies correct classes for label animation', () => {
      wrapper = createWrapper()
      const label = wrapper.find('label')
      
      expect(label.classes()).toContain('absolute')
      expect(label.classes()).toContain('z-10')
      expect(label.classes()).toContain('transition-all')
    })
  })

  describe('Accessibility', () => {
    it('associates label with input correctly', () => {
      wrapper = createWrapper({ id: 'test-input' })
      const input = wrapper.find('input')
      const label = wrapper.find('label')
      
      expect(input.attributes('id')).toBe('test-input')
      expect(label.attributes('for')).toBe('test-input')
    })

    it('provides proper button type for password toggle', () => {
      wrapper = createWrapper({ type: 'password' })
      const button = wrapper.find('button')
      expect(button.attributes('type')).toBe('button')
    })
  })

  describe('Styling Classes', () => {
    it('applies correct base classes', () => {
      wrapper = createWrapper()
      const container = wrapper.find('.relative')
      expect(container.exists()).toBe(true)
    })

    it('applies error border class when error exists', () => {
      wrapper = createWrapper({ errorMessage: 'Error' })
      const borderContainer = wrapper.find('.border-error')
      expect(borderContainer.exists()).toBe(true)
    })

    it('applies focus ring classes', () => {
      wrapper = createWrapper()
      const container = wrapper.find('.focus-within\\:ring-2')
      expect(container.exists()).toBe(true)
    })
  })
}) 