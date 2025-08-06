import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WelcomeView from '../WelcomeView.vue'

// Mock the components
vi.mock('@/components/ContainerMain.vue', () => ({
  default: {
    name: 'ContainerMain',
    template: '<div class="container-main"><slot /></div>',
  },
}))

vi.mock('@/components/icons/IconLogo.vue', () => ({
  default: {
    name: 'IconLogo',
    template: '<div class="icon-logo" data-testid="logo">Logo</div>',
  },
}))

describe('WelcomeView', () => {
  describe('Rendering', () => {
    it('should render the welcome view correctly', () => {
      const wrapper = mount(WelcomeView)
      
      expect(wrapper.find('[data-testid="welcome-view"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="logo"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="wallet-title"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="welcome-subtitle"]').exists()).toBe(true)
    })

    it('should display the correct wallet title', () => {
      const wrapper = mount(WelcomeView)
      const title = wrapper.find('[data-testid="wallet-title"]')
      
      expect(title.text()).toContain('MirrorStack Wallet')
    })

    it('should display the correct welcome subtitle', () => {
      const wrapper = mount(WelcomeView)
      const subtitle = wrapper.find('[data-testid="welcome-subtitle"]')
      
      expect(subtitle.text()).toBe('Welcome to MirrorStack Wallet')
    })
  })

  describe('Action Buttons', () => {
    it('should render all three action buttons', () => {
      const wrapper = mount(WelcomeView)
      
      expect(wrapper.find('[data-testid="create-account-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="restore-account-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="import-cold-wallet-button"]').exists()).toBe(true)
    })

    it('should have correct button text for create account', () => {
      const wrapper = mount(WelcomeView)
      const createButton = wrapper.find('[data-testid="create-account-button"]')
      
      expect(createButton.text()).toContain('Create an Account')
      expect(createButton.text()).toContain('Sign Up for an Account with your Email, Name, and store the passphase')
    })

    it('should have correct button text for restore account', () => {
      const wrapper = mount(WelcomeView)
      const restoreButton = wrapper.find('[data-testid="restore-account-button"]')
      
      expect(restoreButton.text()).toContain('Restore your Account')
      expect(restoreButton.text()).toContain('Restore your account via your passphrase.')
    })

    it('should have correct button text for import cold wallet', () => {
      const wrapper = mount(WelcomeView)
      const importButton = wrapper.find('[data-testid="import-cold-wallet-button"]')
      
      expect(importButton.text()).toContain('Import Cold Wallet')
    })
  })

  describe('Button Icons', () => {
    it('should display correct icons for each button', () => {
      const wrapper = mount(WelcomeView)
      
      const createButton = wrapper.find('[data-testid="create-account-button"]')
      const restoreButton = wrapper.find('[data-testid="restore-account-button"]')
      const importButton = wrapper.find('[data-testid="import-cold-wallet-button"]')
      
      // Check for material symbols icons
      expect(createButton.find('.material-symbols-rounded').exists()).toBe(true)
      expect(restoreButton.find('.material-symbols-rounded').exists()).toBe(true)
      expect(importButton.find('.material-symbols-rounded').exists()).toBe(true)
    })

    it('should have correct icon text for create account', () => {
      const wrapper = mount(WelcomeView)
      const createButton = wrapper.find('[data-testid="create-account-button"]')
      const icon = createButton.find('.material-symbols-rounded')
      
      expect(icon.text()).toBe('description')
    })

    it('should have correct icon text for restore account', () => {
      const wrapper = mount(WelcomeView)
      const restoreButton = wrapper.find('[data-testid="restore-account-button"]')
      const icon = restoreButton.find('.material-symbols-rounded')
      
      expect(icon.text()).toBe('restore')
    })

    it('should have correct icon text for import cold wallet', () => {
      const wrapper = mount(WelcomeView)
      const importButton = wrapper.find('[data-testid="import-cold-wallet-button"]')
      const icon = importButton.find('.material-symbols-rounded')
      
      expect(icon.text()).toBe('key')
    })
  })

  describe('Styling and Classes', () => {
    it('should have correct background styling', () => {
      const wrapper = mount(WelcomeView)
      const container = wrapper.find('[data-testid="welcome-view"]')
      
      expect(container.classes()).toContain('bg-[#f6fafe]')
      expect(container.classes()).toContain('relative')
      expect(container.classes()).toContain('w-full')
      expect(container.classes()).toContain('h-full')
    })

    it('should have correct button styling classes', () => {
      const wrapper = mount(WelcomeView)
      const createButton = wrapper.find('[data-testid="create-account-button"]')
      const restoreButton = wrapper.find('[data-testid="restore-account-button"]')
      const importButton = wrapper.find('[data-testid="import-cold-wallet-button"]')
      
      // Create account button should have primary styling
      expect(createButton.classes()).toContain('bg-primary')
      expect(createButton.classes()).toContain('text-on-primary')
      
      // Restore account button should have outline styling
      expect(restoreButton.classes()).toContain('border-2')
      expect(restoreButton.classes()).toContain('border-outline')
      expect(restoreButton.classes()).toContain('text-on-surface')
      
      // Import cold wallet button should have tertiary styling
      expect(importButton.classes()).toContain('border-2')
      expect(importButton.classes()).toContain('border-tertiary')
      expect(importButton.classes()).toContain('text-tertiary')
    })

    it('should have hover and active state classes', () => {
      const wrapper = mount(WelcomeView)
      const createButton = wrapper.find('[data-testid="create-account-button"]')
      
      expect(createButton.classes()).toContain('hover:bg-primary-container')
      expect(createButton.classes()).toContain('hover:text-on-primary-container')
      expect(createButton.classes()).toContain('hover:scale-[1.02]')
      expect(createButton.classes()).toContain('active:scale-[0.98]')
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const wrapper = mount(WelcomeView)
      
      // Should have a main heading
      const heading = wrapper.find('h1')
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toContain('MirrorStack Wallet')
      
      // Should have descriptive text
      const subtitle = wrapper.find('p')
      expect(subtitle.exists()).toBe(true)
      expect(subtitle.text()).toBe('Welcome to MirrorStack Wallet')
    })

    it('should have proper button accessibility', () => {
      const wrapper = mount(WelcomeView)
      const buttons = wrapper.findAll('button')
      
      // Check that buttons exist and are accessible
      expect(buttons.length).toBeGreaterThan(0)
      
      buttons.forEach(button => {
        // Check that buttons are focusable and have proper role
        expect(button.element.tagName).toBe('BUTTON')
        expect(button.isVisible()).toBe(true)
      })
    })
  })

  describe('Layout and Spacing', () => {
    it('should have correct flex layout', () => {
      const wrapper = mount(WelcomeView)
      const mainContent = wrapper.find('.flex.flex-col')
      
      expect(mainContent.exists()).toBe(true)
      expect(mainContent.classes()).toContain('items-center')
      expect(mainContent.classes()).toContain('justify-center')
      expect(mainContent.classes()).toContain('gap-2')
      expect(mainContent.classes()).toContain('text-center')
    })

    it('should have correct button container spacing', () => {
      const wrapper = mount(WelcomeView)
      const buttonContainer = wrapper.find('.w-full.py-2.px-4.flex.flex-col.gap-3')
      
      expect(buttonContainer.exists()).toBe(true)
    })

    it('should have correct logo sizing', () => {
      const wrapper = mount(WelcomeView)
      const logo = wrapper.find('[data-testid="logo"]')
      
      expect(logo.classes()).toContain('w-16')
      expect(logo.classes()).toContain('h-16')
      expect(logo.classes()).toContain('text-primary')
    })
  })
}) 