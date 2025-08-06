import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import SecurityApiService, { 
  type SecurityCheckRequest, 
  type SecurityCheckResponse 
} from '../SecurityApiService'

describe('SecurityApiService', () => {
  let securityService: SecurityApiService
  let mockChrome: any

  beforeEach(() => {
    // Reset the singleton instance
    ;(SecurityApiService as any).instance = undefined
    
    // Create fresh instance
    securityService = SecurityApiService.getInstance()
    
    // Mock Chrome APIs
    mockChrome = {
      runtime: {
        sendMessage: vi.fn()
      }
    }
    
    ;(window as any).chrome = mockChrome
    
    // Mock crypto API
    Object.defineProperty(window, 'crypto', {
      value: {
        getRandomValues: vi.fn((array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
          }
          return array
        })
      },
      writable: true
    })
    
    // Mock fetch API
    global.fetch = vi.fn()
    
    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SecurityApiService.getInstance()
      const instance2 = SecurityApiService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('CSRF Token Management', () => {
    it('should generate CSRF token on initialization', () => {
      const token = securityService.getCSRFToken()
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate unique CSRF tokens for different instances', () => {
      // Reset instance to create new one
      ;(SecurityApiService as any).instance = undefined
      const newService = SecurityApiService.getInstance()
      
      const token1 = securityService.getCSRFToken()
      const token2 = newService.getCSRFToken()
      
      expect(token1).not.toBe(token2)
    })

    it('should validate correct CSRF token', () => {
      const token = securityService.getCSRFToken()
      
      expect(securityService.validateCSRFToken(token)).toBe(true)
    })

    it('should reject invalid CSRF token', () => {
      expect(securityService.validateCSRFToken('invalid-token')).toBe(false)
    })

    it('should reject empty CSRF token', () => {
      expect(securityService.validateCSRFToken('')).toBe(false)
    })
  })

  describe('handleSecurityCheck', () => {
    it('should handle test action successfully', async () => {
      const request: SecurityCheckRequest = {
        action: 'test',
        csrfToken: securityService.getCSRFToken()
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response).toEqual({
        success: true,
        message: 'Security check passed',
        data: { status: 'secure' },
        csrfToken: expect.any(String)
      })
    })

    it('should handle validate action successfully', async () => {
      const request: SecurityCheckRequest = {
        action: 'validate',
        csrfToken: securityService.getCSRFToken()
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response).toEqual({
        success: true,
        message: 'Security validation completed',
        data: { validated: true },
        csrfToken: expect.any(String)
      })
    })

    it('should reject bypass attempt', async () => {
      const request: SecurityCheckRequest = {
        action: 'bypass',
        csrfToken: securityService.getCSRFToken()
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response).toEqual({
        success: false,
        message: 'Security bypass attempt detected',
        csrfToken: expect.any(String)
      })
    })

    it('should reject request without CSRF token', async () => {
      const request: SecurityCheckRequest = {
        action: 'test'
        // missing csrfToken
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response).toEqual({
        success: false,
        message: 'Invalid CSRF token',
        csrfToken: expect.any(String)
      })
    })

    it('should reject request with invalid CSRF token', async () => {
      const request: SecurityCheckRequest = {
        action: 'test',
        csrfToken: 'invalid-token'
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response).toEqual({
        success: false,
        message: 'Invalid CSRF token',
        csrfToken: expect.any(String)
      })
    })

    it('should handle invalid action', async () => {
      const request: SecurityCheckRequest = {
        action: 'invalid-action',
        csrfToken: securityService.getCSRFToken()
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response).toEqual({
        success: false,
        message: 'Invalid security check action',
        csrfToken: expect.any(String)
      })
    })

    it('should sanitize input data', async () => {
      const request: SecurityCheckRequest = {
        action: 'test',
        data: {
          malicious: '<script>alert("XSS")</script>',
          normal: 'safe-data'
        },
        csrfToken: securityService.getCSRFToken()
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response.success).toBe(true)
      // The sanitization should prevent XSS in the action
      expect(response.message).toBe('Security check passed')
    })
  })

  describe('Input Sanitization', () => {
    it('should remove script tags', () => {
      const maliciousInput = '<script>alert("XSS")</script>'
      const sanitized = (securityService as any).sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('</script>')
    })

    it('should remove javascript: protocol', () => {
      const maliciousInput = 'javascript:alert("XSS")'
      const sanitized = (securityService as any).sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('javascript:')
    })

    it('should remove event handlers', () => {
      const maliciousInput = 'onclick="alert(\'XSS\')" onload="alert(\'XSS\')"'
      const sanitized = (securityService as any).sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('onclick')
      expect(sanitized).not.toContain('onload')
    })

    it('should remove iframe tags', () => {
      const maliciousInput = '<iframe src="malicious.com"></iframe>'
      const sanitized = (securityService as any).sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('<iframe')
    })

    it('should remove object tags', () => {
      const maliciousInput = '<object data="malicious.com"></object>'
      const sanitized = (securityService as any).sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('<object')
    })

    it('should remove embed tags', () => {
      const maliciousInput = '<embed src="malicious.com">'
      const sanitized = (securityService as any).sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('<embed')
    })

    it('should preserve safe content', () => {
      const safeInput = 'This is safe content with <strong>HTML</strong>'
      const sanitized = (securityService as any).sanitizeInput(safeInput)
      
      expect(sanitized).toBe(safeInput)
    })
  })

  describe('validateSecurityHeaders', () => {
    it('should validate security headers successfully', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: { validated: true }
      })

      const result = await securityService.validateSecurityHeaders()

      expect(result).toBe(true)
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'API_SECURITY_CHECK',
        data: {
          action: 'validate',
          csrfToken: expect.any(String)
        }
      })
    })

    it('should return false when Chrome runtime is not available', async () => {
      ;(window as any).chrome = undefined

      const result = await securityService.validateSecurityHeaders()

      expect(result).toBe(false)
    })

    it('should return false when response is invalid', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: false,
        data: { validated: false }
      })

      const result = await securityService.validateSecurityHeaders()

      expect(result).toBe(false)
    })

    it('should return false when response is missing success property', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({
        data: { validated: true }
        // missing success property
      })

      const result = await securityService.validateSecurityHeaders()

      expect(result).toBe(false)
    })

    it('should handle runtime errors gracefully', async () => {
      mockChrome.runtime.sendMessage.mockRejectedValue(new Error('Runtime error'))

      const result = await securityService.validateSecurityHeaders()

      expect(result).toBe(false)
    })
  })

  describe('testXSSProtection', () => {
    it('should test XSS protection successfully', async () => {
      const result = await securityService.testXSSProtection()

      expect(result).toBe(true)
    })

    it('should handle XSS protection test errors', async () => {
      // Mock sanitizeInput to throw error
      vi.spyOn(securityService as any, 'sanitizeInput').mockImplementation(() => {
        throw new Error('Sanitization error')
      })

      const result = await securityService.testXSSProtection()

      expect(result).toBe(false)
    })
  })

  describe('testCSRFProtection', () => {
    it('should test CSRF protection successfully', async () => {
      // Mock fetch to return 401 (unauthorized)
      ;(global.fetch as any).mockResolvedValue({
        status: 401
      })

      const result = await securityService.testCSRFProtection()

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/security-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'bypass'
        })
      })
    })

    it('should return false when request is authorized (should be unauthorized)', async () => {
      // Mock fetch to return 200 (authorized - this should not happen for bypass attempt)
      ;(global.fetch as any).mockResolvedValue({
        status: 200
      })

      const result = await securityService.testCSRFProtection()

      expect(result).toBe(false)
    })

    it('should handle fetch errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const result = await securityService.testCSRFProtection()

      expect(result).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle security check errors gracefully', async () => {
      const request: SecurityCheckRequest = {
        action: 'invalid-action', // This will trigger the default case
        csrfToken: securityService.getCSRFToken()
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response.success).toBe(false)
      expect(response.message).toBe('Invalid security check action')
    })

    it('should handle crypto API errors gracefully', () => {
      // Mock crypto.getRandomValues to throw error
      ;(window.crypto.getRandomValues as any).mockImplementation(() => {
        throw new Error('Crypto error')
      })

      // Create new instance to trigger CSRF token generation
      ;(SecurityApiService as any).instance = undefined
      
      expect(() => SecurityApiService.getInstance()).toThrow('Crypto error')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete security check flow', async () => {
      // Test CSRF token generation and validation
      const token = securityService.getCSRFToken()
      expect(securityService.validateCSRFToken(token)).toBe(true)

      // Test security check with valid token
      const request: SecurityCheckRequest = {
        action: 'test',
        csrfToken: token
      }

      const response = await securityService.handleSecurityCheck(request)
      expect(response.success).toBe(true)
      expect(response.csrfToken).toBe(token)
    })

    it('should handle multiple security checks with same token', async () => {
      const token = securityService.getCSRFToken()

      const request1: SecurityCheckRequest = {
        action: 'test',
        csrfToken: token
      }

      const request2: SecurityCheckRequest = {
        action: 'validate',
        csrfToken: token
      }

      const response1 = await securityService.handleSecurityCheck(request1)
      const response2 = await securityService.handleSecurityCheck(request2)

      expect(response1.success).toBe(true)
      expect(response2.success).toBe(true)
      expect(response1.csrfToken).toBe(token)
      expect(response2.csrfToken).toBe(token)
    })

    it('should handle security check with data sanitization', async () => {
      const token = securityService.getCSRFToken()

      const request: SecurityCheckRequest = {
        action: 'test',
        data: {
          userInput: '<script>alert("XSS")</script>',
          safeData: 'normal text'
        },
        csrfToken: token
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response.success).toBe(true)
      // The sanitization should prevent XSS in the data
      expect(response.message).toBe('Security check passed')
    })
  })

  describe('Security Edge Cases', () => {
    it('should handle empty action', async () => {
      const request: SecurityCheckRequest = {
        action: '',
        csrfToken: securityService.getCSRFToken()
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response.success).toBe(false)
      expect(response.message).toBe('Invalid security check action')
    })

    it('should handle null/undefined data', async () => {
      const request: SecurityCheckRequest = {
        action: 'test',
        data: null as any,
        csrfToken: securityService.getCSRFToken()
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response.success).toBe(true)
      expect(response.message).toBe('Security check passed')
    })

    it('should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000)
      const request: SecurityCheckRequest = {
        action: longString,
        csrfToken: securityService.getCSRFToken()
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response.success).toBe(false)
      expect(response.message).toBe('Invalid security check action')
    })

    it('should handle special characters in input', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const request: SecurityCheckRequest = {
        action: specialChars,
        csrfToken: securityService.getCSRFToken()
      }

      const response = await securityService.handleSecurityCheck(request)

      expect(response.success).toBe(false)
      expect(response.message).toBe('Invalid security check action')
    })
  })
}) 