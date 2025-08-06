import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BiometricCheck } from '../biometric-check'
import { type BiometricStatus, SecurityCheckStep } from '../types'

describe('BiometricCheck', () => {
  let biometricCheck: BiometricCheck
  let mockNavigator: any
  let mockWindow: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock navigator
    mockNavigator = {
      credentials: {
        create: vi.fn(),
        get: vi.fn()
      },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    // Mock window
    mockWindow = {
      PublicKeyCredential: vi.fn(),
      WebAuthn: vi.fn()
    }
    
    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    })
    
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    })
    
    // Create fresh instance with mock config
    const mockConfig = {
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
      timeoutMs: 10000,
      retryAttempts: 3,
      delayMs: 100
    }
    
    const mockState = {
      isChecking: false,
      currentStep: SecurityCheckStep.INITIALIZING,
      progress: 0,
      error: null,
      deviceFingerprint: null,
      hsmStatus: { isAvailable: false, isInitialized: false, keyPairGenerated: false },
      biometricStatus: { isAvailable: false, isSupported: false, isAuthenticated: false, platform: 'unsupported' as const },
      zkpStatus: { isReady: false, challengeReceived: false, proofGenerated: false, isAuthenticated: false },
      cspStatus: { isEnabled: false, hasSecurePolicy: false, hasFrameAncestors: false, hasUnsafeInline: false, hasUnsafeEval: false },
      tlsStatus: { isSecure: false, hasHSTS: false, hasSecureCookies: false, hasValidCertificate: false },
      headersStatus: { hasXFrameOptions: false, hasXContentTypeOptions: false, hasReferrerPolicy: false, hasPermissionsPolicy: false },
      cryptoStatus: { isAvailable: false, hasSecureRandom: false, hasSubtleCrypto: false, hasKeyGeneration: false, hasEncryption: false },
      storageStatus: { isSecure: false, hasSecureStorage: false, hasEncryptedStorage: false, hasSessionStorage: false, hasLocalStorage: false },
      domSkimmingStatus: { isProtected: false, hasSensitiveDataInDOM: false, hasSecureUIElements: false, hasIsolatedStorage: false }
    }
    
    biometricCheck = new BiometricCheck(mockConfig, mockState)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Initialization', () => {
    it('initializes with correct name', () => {
      expect(biometricCheck.getName()).toBe('Biometric Check')
    })

    it('is enabled when configured', () => {
      expect(biometricCheck.isEnabled()).toBe(true)
    })

    it('is disabled when not configured', () => {
      const disabledConfig = {
        enableHSM: true,
        enableBiometric: false,
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
        timeoutMs: 10000,
        retryAttempts: 3,
        delayMs: 100
      }
      
      const disabledState = {
        isChecking: false,
        currentStep: SecurityCheckStep.INITIALIZING,
        progress: 0,
        error: null,
        deviceFingerprint: null,
        hsmStatus: { isAvailable: false, isInitialized: false, keyPairGenerated: false },
        biometricStatus: { isAvailable: false, isSupported: false, isAuthenticated: false, platform: 'unsupported' as const },
        zkpStatus: { isReady: false, challengeReceived: false, proofGenerated: false, isAuthenticated: false },
        cspStatus: { isEnabled: false, hasSecurePolicy: false, hasFrameAncestors: false, hasUnsafeInline: false, hasUnsafeEval: false },
        tlsStatus: { isSecure: false, hasHSTS: false, hasSecureCookies: false, hasValidCertificate: false },
        headersStatus: { hasXFrameOptions: false, hasXContentTypeOptions: false, hasReferrerPolicy: false, hasPermissionsPolicy: false },
        cryptoStatus: { isAvailable: false, hasSecureRandom: false, hasSubtleCrypto: false, hasKeyGeneration: false, hasEncryption: false },
        storageStatus: { isSecure: false, hasSecureStorage: false, hasEncryptedStorage: false, hasSessionStorage: false, hasLocalStorage: false },
        domSkimmingStatus: { isProtected: false, hasSensitiveDataInDOM: false, hasSecureUIElements: false, hasIsolatedStorage: false }
      }
      
      const disabledBiometricCheck = new BiometricCheck(disabledConfig, disabledState)
      expect(disabledBiometricCheck.isEnabled()).toBe(false)
    })
  })

  describe('Biometric Security Check Execution', () => {
    it('performs biometric check successfully on macOS', async () => {
      // Mock successful biometric check
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.resolve(true)
        }
      }
      
      const result = await biometricCheck.execute()
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      if (result.data) {
        expect(result.data.isAvailable).toBe(true)
        expect(result.data.platform).toBe('macos')
      }
    })

    it('handles biometric check failure', async () => {
      // Mock failed biometric check
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.resolve(false)
        }
      }
      
      const result = await biometricCheck.execute()
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('handles biometric check error', async () => {
      // Mock biometric check error
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.reject(new Error('Biometric check failed'))
        }
      }
      
      const result = await biometricCheck.execute()
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Platform Detection', () => {
    it('detects macOS platform correctly', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.resolve(true)
        }
      }
      
      const result = await biometricCheck.execute()
      
      expect(result.success).toBe(true)
      if (result.data) {
        expect(result.data.platform).toBe('macos')
      }
    })

    it('detects Windows platform correctly', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.resolve(true)
        }
      }
      
      const result = await biometricCheck.execute()
      
      expect(result.success).toBe(true)
      if (result.data) {
        expect(result.data.platform).toBe('windows')
      }
    })

    it('detects unsupported platform correctly', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; x86_64) AppleWebKit/537.36'
      
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.resolve(false)
        }
      }
      
      const result = await biometricCheck.execute()
      
      expect(result.success).toBe(false)
      if (result.data) {
        expect(result.data.platform).toBe('unsupported')
      }
    })
  })

  describe('Error Handling', () => {
    it('handles timeout errors', async () => {
      // Mock timeout
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
        }
      }
      
      const result = await biometricCheck.execute()
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('handles network errors', async () => {
      // Mock network error
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.reject(new Error('Network error'))
        }
      }
      
      const result = await biometricCheck.execute()
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('handles platform-specific errors', async () => {
      // Mock platform-specific error
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.reject(new Error('Platform not supported'))
        }
      }
      
      const result = await biometricCheck.execute()
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Integration with BaseSecurityCheck', () => {
    it('calls handleError from base class', async () => {
      // Mock error
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.reject(new Error('Test error'))
        }
      }
      
      const result = await biometricCheck.execute()
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Biometric check failed')
    })

    it('updates progress correctly', async () => {
      const mockUpdateProgress = vi.fn()
      biometricCheck['updateProgress'] = mockUpdateProgress
      
      mockWindow.PublicKeyCredential = class MockPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.resolve(true)
        }
      }
      
      await biometricCheck.execute()
      
      expect(mockUpdateProgress).toHaveBeenCalledWith(SecurityCheckStep.BIOMETRIC_CHECK, expect.any(Number))
    })
  })
}) 