import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import AuthenticationService, { 
  type AuthenticationRequest, 
  type AuthenticationResponse,
  type AuthenticationStatus,
  type TimeoutConfig 
} from '../AuthenticationService'

describe('AuthenticationService', () => {
  let authService: AuthenticationService
  let mockChrome: any

  beforeEach(() => {
    // Reset the singleton instance
    ;(AuthenticationService as any).instance = undefined
    
    // Create fresh instance
    authService = AuthenticationService.getInstance()
    
    // Mock Chrome APIs
    mockChrome = {
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn()
        }
      },
      runtime: {
        sendMessage: vi.fn()
      }
    }
    
    ;(window as any).chrome = mockChrome
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    // Mock window.parent
    Object.defineProperty(window, 'parent', {
      value: window,
      writable: true
    })
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AuthenticationService.getInstance()
      const instance2 = AuthenticationService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('storeAuthenticationRequest', () => {
    it('should store authentication request successfully', async () => {
      const request: AuthenticationRequest = {
        sourceUrl: 'https://example.com',
        destinationUrl: 'https://wallet.com',
        requestId: 'test-request-123'
      }

      mockChrome.storage.local.get.mockResolvedValue({ authRequests: {} })
      mockChrome.storage.local.set.mockResolvedValue(undefined)

      await authService.storeAuthenticationRequest(request)

      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['authRequests'])
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        authRequests: expect.objectContaining({
          'test-request-123': expect.objectContaining({
            ...request,
            status: 'pending',
            createdAt: expect.any(String),
            startTime: expect.any(Number)
          })
        })
      })
    })

    it('should throw error when Chrome storage is not available', async () => {
      ;(window as any).chrome = undefined
      
      const request: AuthenticationRequest = {
        sourceUrl: 'https://example.com',
        destinationUrl: 'https://wallet.com',
        requestId: 'test-request-123'
      }

      await expect(authService.storeAuthenticationRequest(request)).rejects.toThrow('Chrome storage not available')
    })

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'))

      const request: AuthenticationRequest = {
        sourceUrl: 'https://example.com',
        destinationUrl: 'https://wallet.com',
        requestId: 'test-request-123'
      }

      await expect(authService.storeAuthenticationRequest(request)).rejects.toThrow('Storage error')
    })
  })

  describe('getAuthenticationRequest', () => {
    it('should return authentication request by ID', async () => {
      const mockRequest = {
        sourceUrl: 'https://example.com',
        destinationUrl: 'https://wallet.com',
        requestId: 'test-request-123',
        status: 'pending'
      }

      mockChrome.storage.local.get.mockResolvedValue({
        authRequests: { 'test-request-123': mockRequest }
      })

      const result = await authService.getAuthenticationRequest('test-request-123')

      expect(result).toEqual(mockRequest)
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['authRequests'])
    })

    it('should return null when request not found', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ authRequests: {} })

      const result = await authService.getAuthenticationRequest('non-existent')

      expect(result).toBeNull()
    })

    it('should return null when Chrome storage is not available', async () => {
      ;(window as any).chrome = undefined

      const result = await authService.getAuthenticationRequest('test-request-123')

      expect(result).toBeNull()
    })
  })

  describe('getPendingAuthenticationRequest', () => {
    it('should return pending authentication request', async () => {
      const mockRequests = {
        'request-1': { status: 'completed', requestId: 'request-1' },
        'request-2': { status: 'pending', requestId: 'request-2' },
        'request-3': { status: 'cancelled', requestId: 'request-3' }
      }

      mockChrome.storage.local.get.mockResolvedValue({ authRequests: mockRequests })

      const result = await authService.getPendingAuthenticationRequest()

      expect(result).toEqual(mockRequests['request-2'])
    })

    it('should return null when no pending requests exist', async () => {
      const mockRequests = {
        'request-1': { status: 'completed', requestId: 'request-1' },
        'request-2': { status: 'cancelled', requestId: 'request-2' }
      }

      mockChrome.storage.local.get.mockResolvedValue({ authRequests: mockRequests })

      const result = await authService.getPendingAuthenticationRequest()

      expect(result).toBeNull()
    })
  })

  describe('updateAuthenticationStatus', () => {
    it('should update authentication status successfully', async () => {
      const mockRequests = {
        'test-request-123': {
          sourceUrl: 'https://example.com',
          destinationUrl: 'https://wallet.com',
          requestId: 'test-request-123',
          status: 'pending'
        }
      }

      mockChrome.storage.local.get.mockResolvedValue({ authRequests: mockRequests })
      mockChrome.storage.local.set.mockResolvedValue(undefined)

      await authService.updateAuthenticationStatus('test-request-123', 'completed')

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        authRequests: expect.objectContaining({
          'test-request-123': expect.objectContaining({
            status: 'completed'
          })
        })
      })
    })

    it('should not update when request ID does not exist', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ authRequests: {} })
      mockChrome.storage.local.set.mockResolvedValue(undefined)

      await authService.updateAuthenticationStatus('non-existent', 'completed')

      // Should not call set since the request ID doesn't exist
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled()
    })
  })

  describe('clearAuthenticationStatus', () => {
    it('should clear authentication status and send message', async () => {
      // Mock that the request exists in storage
      mockChrome.storage.local.get.mockResolvedValue({ 
        authRequests: { 'test-request-123': { status: 'pending' } } 
      })
      mockChrome.storage.local.set.mockResolvedValue(undefined)
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined)

      await authService.clearAuthenticationStatus('test-request-123', 'completed')

      expect(mockChrome.storage.local.set).toHaveBeenCalled()
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'AUTHENTICATION_COMPLETED',
        requestId: 'test-request-123'
      })
    })

    it('should handle runtime unavailability gracefully', async () => {
      // Mock Chrome with only storage, no runtime
      ;(window as any).chrome = { 
        storage: mockChrome.storage 
      }
      
      // Mock that the request exists in storage
      mockChrome.storage.local.get.mockResolvedValue({ 
        authRequests: { 'test-request-123': { status: 'pending' } } 
      })
      mockChrome.storage.local.set.mockResolvedValue(undefined)

      // The method should complete successfully since updateAuthenticationStatus succeeds
      // and the runtime check is only for sending the message, not for the main operation
      await authService.clearAuthenticationStatus('test-request-123', 'completed')
      
      // Should not throw since the main operation (updateAuthenticationStatus) succeeds
      expect(mockChrome.storage.local.set).toHaveBeenCalled()
    })
  })

  describe('getTimeoutConfig', () => {
    it('should return timeout from Chrome storage', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ extensionTimeoutSeconds: 60 })

      const result = await authService.getTimeoutConfig()

      expect(result).toBe(60)
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['extensionTimeoutSeconds'])
    })

    it('should return timeout from parent window', async () => {
      mockChrome.storage.local.get.mockResolvedValue({})
      // Mock window.parent properly
      Object.defineProperty(window, 'parent', {
        value: {
          openExtensionTimeoutSeconds: 30
        },
        writable: true
      })

      const result = await authService.getTimeoutConfig()

      expect(result).toBe(30)
    })

    it('should return timeout from localStorage', async () => {
      mockChrome.storage.local.get.mockResolvedValue({})
      ;(window.parent as any).openExtensionTimeoutSeconds = undefined
      ;(window.localStorage.getItem as any).mockReturnValue('45')

      const result = await authService.getTimeoutConfig()

      expect(result).toBe(45)
    })

    it('should return default timeout when no configuration found', async () => {
      mockChrome.storage.local.get.mockResolvedValue({})
      ;(window.parent as any).openExtensionTimeoutSeconds = undefined
      ;(window.localStorage.getItem as any).mockReturnValue(null)

      const result = await authService.getTimeoutConfig()

      expect(result).toBe(45) // default timeout
    })
  })

  describe('calculateRemainingTime', () => {
    it('should calculate remaining time correctly', async () => {
      vi.spyOn(authService, 'getTimeoutConfig').mockResolvedValue(60)
      
      const startTime = Date.now() - 30000 // 30 seconds ago
      const result = await authService.calculateRemainingTime(startTime)

      expect(result).toBe(30) // 60 - 30 = 30 seconds remaining
    })

    it('should return 0 when time has expired', async () => {
      vi.spyOn(authService, 'getTimeoutConfig').mockResolvedValue(30)
      
      const startTime = Date.now() - 60000 // 60 seconds ago
      const result = await authService.calculateRemainingTime(startTime)

      expect(result).toBe(0)
    })
  })

  describe('sendStatusUpdate', () => {
    it('should send status update successfully', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(undefined)

      await authService.sendStatusUpdate('completed', 'test-request-123')

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'AUTHENTICATION_STATUS_UPDATE',
        status: 'completed',
        requestId: 'test-request-123'
      })
    })

    it('should throw error when Chrome runtime is not available', async () => {
      ;(window as any).chrome = undefined

      await expect(authService.sendStatusUpdate('completed', 'test-request-123')).rejects.toThrow('Chrome runtime not available')
    })
  })

  describe('dispatchStatusUpdateEvent', () => {
    it('should dispatch custom event', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      
      authService.dispatchStatusUpdateEvent('completed', 'test-request-123')

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MirrorStackWalletAuthUpdate',
          detail: {
            status: 'completed',
            requestId: 'test-request-123'
          }
        })
      )
    })
  })

  describe('generateRequestId', () => {
    it('should generate unique request ID', () => {
      const id1 = authService.generateRequestId()
      const id2 = authService.generateRequestId()

      expect(id1).toMatch(/^auth_\d+_[a-z0-9]{9}$/)
      expect(id2).toMatch(/^auth_\d+_[a-z0-9]{9}$/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('validateAuthenticationRequest', () => {
    it('should validate complete request', () => {
      const request: AuthenticationRequest = {
        sourceUrl: 'https://example.com',
        destinationUrl: 'https://wallet.com',
        requestId: 'test-request-123'
      }

      expect(authService.validateAuthenticationRequest(request)).toBe(true)
    })

    it('should reject incomplete request', () => {
      const request = {
        sourceUrl: 'https://example.com',
        // missing destinationUrl and requestId
      }

      expect(authService.validateAuthenticationRequest(request)).toBe(false)
    })

    it('should reject request with missing sourceUrl', () => {
      const request = {
        destinationUrl: 'https://wallet.com',
        requestId: 'test-request-123'
      }

      expect(authService.validateAuthenticationRequest(request)).toBe(false)
    })

    it('should reject request with missing destinationUrl', () => {
      const request = {
        sourceUrl: 'https://example.com',
        requestId: 'test-request-123'
      }

      expect(authService.validateAuthenticationRequest(request)).toBe(false)
    })

    it('should reject request with missing requestId', () => {
      const request = {
        sourceUrl: 'https://example.com',
        destinationUrl: 'https://wallet.com'
      }

      expect(authService.validateAuthenticationRequest(request)).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors in getAuthenticationRequest', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'))

      const result = await authService.getAuthenticationRequest('test-request-123')

      expect(result).toBeNull()
    })

    it('should handle storage errors in getPendingAuthenticationRequest', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'))

      const result = await authService.getPendingAuthenticationRequest()

      expect(result).toBeNull()
    })

    it('should handle timeout config errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'))
      ;(window.parent as any).openExtensionTimeoutSeconds = undefined
      ;(window.localStorage.getItem as any).mockReturnValue('invalid')

      const result = await authService.getTimeoutConfig()

      expect(result).toBe(45) // should fall back to default
    })
  })
}) 