import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthenticationFailedView from '../AuthenticationFailedView.vue'
import AuthenticationService from '@/services/AuthenticationService'
import ExtensionCommunicationService from '@/services/ExtensionCommunicationService'

// Mock services
vi.mock('@/services/AuthenticationService')
vi.mock('@/services/ExtensionCommunicationService')

describe('AuthenticationFailedView', () => {
  let mockAuthService: any
  let mockExtensionService: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock AuthenticationService
    mockAuthService = {
      getInstance: vi.fn().mockReturnValue({
        clearAuthenticationStatus: vi.fn().mockResolvedValue(undefined)
      })
    }
    ;(AuthenticationService as any).getInstance = mockAuthService.getInstance

    // Mock ExtensionCommunicationService
    mockExtensionService = {
      getInstance: vi.fn().mockReturnValue({
        sendMessage: vi.fn().mockResolvedValue(undefined)
      })
    }
    ;(ExtensionCommunicationService as any).getInstance = mockExtensionService.getInstance
  })

  it('renders correctly with default props', () => {
    const wrapper = mount(AuthenticationFailedView)
    
    expect(wrapper.find('[data-testid="authentication-failed-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="encrypted-icon"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="failed-title"]').text()).toBe('Authentication Failed')
    expect(wrapper.find('[data-testid="error-message"]').text()).toContain('Error: Authentication failed. Please try again.')
    expect(wrapper.find('[data-testid="close-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="retry-button"]').exists()).toBe(false) // Should not show by default
  })

  it('renders with custom error message', () => {
    const customError = 'Custom authentication error message'
    const wrapper = mount(AuthenticationFailedView, {
      props: {
        errorMessage: customError
      }
    })
    
    expect(wrapper.find('[data-testid="error-message"]').text()).toContain(`Error: ${customError}`)
  })

  it('shows retry button when showRetryButton is true', () => {
    const wrapper = mount(AuthenticationFailedView, {
      props: {
        showRetryButton: true
      }
    })
    
    expect(wrapper.find('[data-testid="retry-button"]').exists()).toBe(true)
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(AuthenticationFailedView)
    
    await wrapper.find('[data-testid="close-button"]').trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits retry event when retry button is clicked', async () => {
    const wrapper = mount(AuthenticationFailedView, {
      props: {
        showRetryButton: true
      }
    })
    
    await wrapper.find('[data-testid="retry-button"]').trigger('click')
    
    expect(wrapper.emitted('retry')).toBeTruthy()
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('emits navigate-to-welcome event when close button is clicked', async () => {
    const wrapper = mount(AuthenticationFailedView)
    
    await wrapper.find('[data-testid="close-button"]').trigger('click')
    
    expect(wrapper.emitted('navigate-to-welcome')).toBeTruthy()
    expect(wrapper.emitted('navigate-to-welcome')).toHaveLength(1)
  })

  it('calls AuthenticationService.clearAuthenticationStatus when close button is clicked', async () => {
    const requestId = 'test-request-id'
    const wrapper = mount(AuthenticationFailedView, {
      props: {
        requestId
      }
    })
    
    await wrapper.find('[data-testid="close-button"]').trigger('click')
    
    expect(mockAuthService.getInstance).toHaveBeenCalled()
    expect(mockAuthService.getInstance().clearAuthenticationStatus).toHaveBeenCalledWith(requestId, 'cancelled')
  })

  it('calls ExtensionCommunicationService.sendMessage when close button is clicked', async () => {
    const requestId = 'test-request-id'
    const errorMessage = 'Test error message'
    const wrapper = mount(AuthenticationFailedView, {
      props: {
        requestId,
        errorMessage
      }
    })
    
    await wrapper.find('[data-testid="close-button"]').trigger('click')
    
    expect(mockExtensionService.getInstance).toHaveBeenCalled()
    expect(mockExtensionService.getInstance().sendMessage).toHaveBeenCalledWith({
      type: 'AUTHENTICATION_FAILED',
      data: {
        requestId,
        error: errorMessage
      }
    })
  })

  it('handles errors gracefully when services fail', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock service to throw error
    mockAuthService.getInstance().clearAuthenticationStatus.mockRejectedValue(new Error('Service error'))
    
    const wrapper = mount(AuthenticationFailedView, {
      props: {
        requestId: 'test-request-id'
      }
    })
    
    await wrapper.find('[data-testid="close-button"]').trigger('click')
    
    expect(consoleSpy).toHaveBeenCalledWith('AuthenticationFailedView: Error handling close:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('logs error message on mount', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorMessage = 'Test error message'
    
    mount(AuthenticationFailedView, {
      props: {
        errorMessage
      }
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('AuthenticationFailedView: Mounted with error:', errorMessage)
    
    consoleSpy.mockRestore()
  })

  it('applies correct styling classes', () => {
    const wrapper = mount(AuthenticationFailedView)
    
    // Check background color
    expect(wrapper.find('[data-testid="authentication-failed-view"]').classes()).toContain('bg-[#f6fafe]')
    
    // Check warning icon styling
    const warningIcon = wrapper.find('[data-testid="encrypted-icon"]')
    expect(warningIcon.classes()).toContain('w-16')
    expect(warningIcon.classes()).toContain('h-16')
    
    // Check close button styling
    const closeButton = wrapper.find('[data-testid="close-button"]')
    expect(closeButton.classes()).toContain('bg-error')
    expect(closeButton.classes()).toContain('text-on-error')
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(AuthenticationFailedView)
    
    // Check that buttons have proper test IDs
    expect(wrapper.find('[data-testid="close-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="encrypted-icon"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="failed-title"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
  })
}) 