import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BaseSecurityCheck } from '../base-check'
import type {
  SecurityCheckConfig,
  SecurityCheckState,
  SecurityCheckResult,
} from '../types'
import { SecurityCheckStep } from '../types'

// Create a concrete implementation for testing
class TestSecurityCheck extends BaseSecurityCheck {
  getName(): string {
    return 'Test Security Check'
  }

  isEnabled(): boolean {
    return this.config.enableTest ?? false
  }

  async execute(): Promise<SecurityCheckResult> {
    this.updateProgress(SecurityCheckStep.RUNNING, 50)
    await this.delay(10)
    this.updateProgress(SecurityCheckStep.COMPLETED, 100)
    
    return {
      success: true,
      data: { testData: 'test' },
    }
  }

  // Expose protected methods for testing
  public testGetContext() {
    return this.getContext()
  }

  public testUpdateProgress(step: SecurityCheckStep, progress: number) {
    return this.updateProgress(step, progress)
  }

  public testHandleError(error: Error, message: string) {
    return this.handleError(error, message)
  }

  public testSanitizeErrorMessage(message: string) {
    return this.sanitizeErrorMessage(message)
  }

  public testValidateInput<T>(data: unknown, validator: (data: unknown) => data is T): T {
    return this.validateInput(data, validator)
  }

  public testSanitizeString(input: string) {
    return this.sanitizeString(input)
  }

  public testSanitizeNumber(input: number) {
    return this.sanitizeNumber(input)
  }

  public testDelay(ms?: number) {
    return this.delay(ms)
  }
}

describe('BaseSecurityCheck', () => {
  let validConfig: SecurityCheckConfig
  let validState: SecurityCheckState

  beforeEach(() => {
    validConfig = {
      enableHSM: true,
      enableBiometric: true,
      enableDeviceFingerprinting: true,
      enableZKP: true,
      enableCSP: true,
      enableTLS: true,
      enableHeaders: true,
      enableCrypto: true,
      enableStorage: true,
      enableDOMProtection: true,
      enableCertificatePinning: true,
      enableGDPRCompliance: true,
      enableThreatDetection: true,
      enableSOC2Compliance: true,
      enableTest: true,
      timeoutMs: 30000,
      retryAttempts: 3,
      delayMs: 100,
    }

    validState = {
      isChecking: false,
      currentStep: SecurityCheckStep.INITIALIZING,
      progress: 0,
      error: null,
      deviceFingerprint: null,
      hsmStatus: {
        isAvailable: false,
        isInitialized: false,
        keyPairGenerated: false,
      },
      biometricStatus: {
        isAvailable: false,
        isSupported: false,
        isAuthenticated: false,
        platform: 'unsupported',
      },
      zkpStatus: {
        isReady: false,
        challengeReceived: false,
        proofGenerated: false,
        isAuthenticated: false,
      },
      cspStatus: {
        isEnabled: false,
        hasSecurePolicy: false,
        hasFrameAncestors: false,
        hasUnsafeInline: false,
        hasUnsafeEval: false,
      },
      tlsStatus: {
        isSecure: false,
        hasHSTS: false,
        hasSecureCookies: false,
        hasValidCertificate: false,
      },
      headersStatus: {
        hasXFrameOptions: false,
        hasXContentTypeOptions: false,
        hasReferrerPolicy: false,
        hasPermissionsPolicy: false,
      },
      cryptoStatus: {
        isAvailable: false,
        hasSecureRandom: false,
        hasSubtleCrypto: false,
        hasKeyGeneration: false,
        hasEncryption: false,
      },
      storageStatus: {
        isSecure: false,
        hasSecureStorage: false,
        hasEncryptedStorage: false,
        hasSessionStorage: false,
        hasLocalStorage: false,
      },
      domSkimmingStatus: {
        isProtected: false,
        hasSensitiveDataInDOM: false,
        hasSecureUIElements: false,
        hasIsolatedStorage: false,
      },
    }
  })

  describe('Constructor', () => {
    it('should create instance with valid config and state', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      expect(check).toBeInstanceOf(BaseSecurityCheck)
      expect(check.getName()).toBe('Test Security Check')
      expect(check.isEnabled()).toBe(true)
    })

    it('should throw error for invalid config (null)', () => {
      expect(() => new TestSecurityCheck(null as any, validState)).toThrow(
        'Invalid security check configuration'
      )
    })

    it('should throw error for invalid config (not object)', () => {
      expect(() => new TestSecurityCheck('invalid' as any, validState)).toThrow(
        'Invalid security check configuration'
      )
    })

    it('should throw error for invalid timeout (too low)', () => {
      const invalidConfig = { ...validConfig, timeoutMs: 500 }
      expect(() => new TestSecurityCheck(invalidConfig, validState)).toThrow(
        'Invalid timeout configuration'
      )
    })

    it('should throw error for invalid timeout (too high)', () => {
      const invalidConfig = { ...validConfig, timeoutMs: 70000 }
      expect(() => new TestSecurityCheck(invalidConfig, validState)).toThrow(
        'Invalid timeout configuration'
      )
    })

    it('should throw error for invalid retry attempts (negative)', () => {
      const invalidConfig = { ...validConfig, retryAttempts: -1 }
      expect(() => new TestSecurityCheck(invalidConfig, validState)).toThrow(
        'Invalid retry attempts configuration'
      )
    })

    it('should throw error for invalid retry attempts (too high)', () => {
      const invalidConfig = { ...validConfig, retryAttempts: 15 }
      expect(() => new TestSecurityCheck(invalidConfig, validState)).toThrow(
        'Invalid retry attempts configuration'
      )
    })

    it('should throw error for invalid delay (negative)', () => {
      const invalidConfig = { ...validConfig, delayMs: -100 }
      expect(() => new TestSecurityCheck(invalidConfig, validState)).toThrow(
        'Invalid delay configuration'
      )
    })

    it('should throw error for invalid delay (too high)', () => {
      const invalidConfig = { ...validConfig, delayMs: 15000 }
      expect(() => new TestSecurityCheck(invalidConfig, validState)).toThrow(
        'Invalid delay configuration'
      )
    })

    it('should throw error for invalid boolean flag', () => {
      const invalidConfig = { ...validConfig, enableHSM: 'invalid' as any }
      expect(() => new TestSecurityCheck(invalidConfig, validState)).toThrow(
        'Invalid configuration for enableHSM'
      )
    })
  })

  describe('getContext', () => {
    it('should return correct context', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const context = check.testGetContext()

      expect(context.config).toBe(validConfig)
      expect(context.state).toBe(validState)
      expect(context.step).toBe(SecurityCheckStep.INITIALIZING)
      expect(context.progress).toBe(0)
    })
  })

  describe('updateProgress', () => {
    it('should update progress correctly', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      check.testUpdateProgress(SecurityCheckStep.RUNNING, 50)

      const context = check.testGetContext()
      expect(context.step).toBe(SecurityCheckStep.RUNNING)
      expect(context.progress).toBe(50)
    })

    it('should throw error for invalid progress (negative)', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      expect(() => check.testUpdateProgress(SecurityCheckStep.RUNNING, -10)).toThrow(
        'Invalid progress value'
      )
    })

    it('should throw error for invalid progress (too high)', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      expect(() => check.testUpdateProgress(SecurityCheckStep.RUNNING, 150)).toThrow(
        'Invalid progress value'
      )
    })

    it('should throw error for invalid progress (not number)', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      expect(() => check.testUpdateProgress(SecurityCheckStep.RUNNING, '50' as any)).toThrow(
        'Invalid progress value'
      )
    })
  })

  describe('delay', () => {
    it('should delay for specified time', async () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const start = Date.now()
      await check.testDelay(50)
      const end = Date.now()
      
      expect(end - start).toBeGreaterThanOrEqual(45) // Allow some tolerance
    })

    it('should use default delay when not specified', async () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const start = Date.now()
      await check.testDelay()
      const end = Date.now()
      
      expect(end - start).toBeGreaterThanOrEqual(95) // 100ms default - tolerance
    })
  })

  describe('handleError', () => {
    it('should handle error correctly', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const error = new Error('Test error')
      const result = check.testHandleError(error, 'Custom error message')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Custom error message')
      expect(result.data).toBeUndefined()
    })

    it('should sanitize error message', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const error = new Error('Test error')
      const result = check.testHandleError(error, '<script>alert("xss")</script>')

      expect(result.success).toBe(false)
      expect(result.error).not.toContain('<script>')
    })
  })

  describe('sanitizeErrorMessage', () => {
    it('should remove HTML tags and special characters', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const sanitized = check.testSanitizeErrorMessage('<script>alert("xss")</script>')
      
      expect(sanitized).toBe('scriptalertxss/script')
    })

    it('should remove multiple HTML tags and special characters', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const sanitized = check.testSanitizeErrorMessage('<div><p>Text</p></div>')
      
      expect(sanitized).toBe('divpText/p/div')
    })

    it('should handle empty string', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const sanitized = check.testSanitizeErrorMessage('')
      
      expect(sanitized).toBe('')
    })

    it('should handle string without HTML', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const sanitized = check.testSanitizeErrorMessage('Plain text message')
      
      expect(sanitized).toBe('Plain text message')
    })

    it('should limit message length', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const longMessage = 'a'.repeat(300)
      const sanitized = check.testSanitizeErrorMessage(longMessage)
      
      expect(sanitized.length).toBeLessThanOrEqual(200)
    })
  })

  describe('validateInput', () => {
    it('should validate input with custom validator', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      
      const stringValidator = (data: unknown): data is string => typeof data === 'string'
      const result = check.testValidateInput('test', stringValidator)
      
      expect(result).toBe('test')
    })

    it('should throw error for invalid input', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      
      const stringValidator = (data: unknown): data is string => typeof data === 'string'
      
      expect(() => check.testValidateInput(123, stringValidator)).toThrow(
        'Invalid input data'
      )
    })
  })

  describe('sanitizeString', () => {
    it('should sanitize string input', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const sanitized = check.testSanitizeString('<script>alert("xss")</script>')
      
      expect(sanitized).toBe('scriptalertxss/script')
    })

    it('should handle empty string', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const sanitized = check.testSanitizeString('')
      
      expect(sanitized).toBe('')
    })

    it('should handle string without special characters', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const sanitized = check.testSanitizeString('Normal text')
      
      expect(sanitized).toBe('Normal text')
    })

    it('should handle non-string input', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const sanitized = check.testSanitizeString(123 as any)
      
      expect(sanitized).toBe('')
    })

    it('should limit string length', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const longString = 'a'.repeat(1500)
      const sanitized = check.testSanitizeString(longString)
      
      expect(sanitized.length).toBeLessThanOrEqual(1000)
    })

    it('should trim whitespace', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const sanitized = check.testSanitizeString('  test  ')
      
      expect(sanitized).toBe('test')
    })
  })

  describe('sanitizeNumber', () => {
    it('should return valid number', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const result = check.testSanitizeNumber(42)
      
      expect(result).toBe(42)
    })

    it('should clamp number to maximum', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const result = check.testSanitizeNumber(Number.MAX_SAFE_INTEGER + 1)
      
      expect(result).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should clamp number to minimum (0)', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const result = check.testSanitizeNumber(-100)
      
      expect(result).toBe(0)
    })

    it('should handle NaN', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const result = check.testSanitizeNumber(NaN)
      
      expect(result).toBe(0)
    })

    it('should handle Infinity', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const result = check.testSanitizeNumber(Infinity)
      
      expect(result).toBe(0)
    })

    it('should handle -Infinity', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const result = check.testSanitizeNumber(-Infinity)
      
      expect(result).toBe(0)
    })
  })

  describe('execute', () => {
    it('should execute successfully', async () => {
      const check = new TestSecurityCheck(validConfig, validState)
      const result = await check.execute()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ testData: 'test' })
      expect(result.error).toBeUndefined()
    })

    it('should update progress during execution', async () => {
      const check = new TestSecurityCheck(validConfig, validState)
      
      const contextBefore = check.testGetContext()
      expect(contextBefore.step).toBe(SecurityCheckStep.INITIALIZING)
      expect(contextBefore.progress).toBe(0)

      await check.execute()

      const contextAfter = check.testGetContext()
      expect(contextAfter.step).toBe(SecurityCheckStep.COMPLETED)
      expect(contextAfter.progress).toBe(100)
    })
  })

  describe('abstract methods', () => {
    it('should have getName method', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      expect(typeof check.getName()).toBe('string')
      expect(check.getName()).toBe('Test Security Check')
    })

    it('should have isEnabled method', () => {
      const check = new TestSecurityCheck(validConfig, validState)
      expect(typeof check.isEnabled()).toBe('boolean')
      expect(check.isEnabled()).toBe(true)
    })

    it('should have execute method', async () => {
      const check = new TestSecurityCheck(validConfig, validState)
      expect(typeof check.execute).toBe('function')
      
      const result = await check.execute()
      expect(result).toHaveProperty('success')
    })
  })
}) 