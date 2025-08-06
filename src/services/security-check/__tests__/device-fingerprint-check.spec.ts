import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DeviceFingerprintCheck } from '../device-fingerprint-check'
import type { SecurityCheckConfig, SecurityCheckState } from '../types'
import { SecurityCheckStep } from '../types'

// Mock crypto API
const mockCrypto = {
  subtle: {
    digest: vi.fn(),
  },
}

// Mock navigator
const mockNavigator = {
  language: 'en-US',
  platform: 'MacIntel',
  hardwareConcurrency: 8,
  cookieEnabled: true,
  onLine: true,
  maxTouchPoints: 5,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

// Mock Intl
const mockIntl = {
  DateTimeFormat: vi.fn().mockReturnValue({
    resolvedOptions: vi.fn().mockReturnValue({
      timeZone: 'America/New_York',
    }),
  }),
}

// Mock WebGL
const mockWebGL = {
  getParameter: vi.fn().mockReturnValue('WebGL 2.0'),
}

// Mock RTCPeerConnection
const mockRTCPeerConnection = vi.fn()

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
}

// Mock notifications
const mockNotification = {
  permission: 'granted',
}

// Mock service worker
const mockServiceWorker = {
  register: vi.fn(),
}

// Mock push manager
const mockPushManager = {
  supported: true,
}

describe('DeviceFingerprintCheck', () => {
  let validConfig: SecurityCheckConfig
  let validState: SecurityCheckState
  let check: DeviceFingerprintCheck

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup global mocks
    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true,
    })

    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
    })

    Object.defineProperty(global, 'Intl', {
      value: {
        DateTimeFormat: vi.fn().mockReturnValue({
          resolvedOptions: vi.fn().mockReturnValue({
            timeZone: 'America/New_York',
          }),
        }),
      },
      writable: true,
    })

    Object.defineProperty(global, 'WebGLRenderingContext', {
      value: mockWebGL,
      writable: true,
    })

    Object.defineProperty(global, 'RTCPeerConnection', {
      value: mockRTCPeerConnection,
      writable: true,
    })

    Object.defineProperty(global, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    })

    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
    })

    Object.defineProperty(global, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true,
    })

    Object.defineProperty(global, 'PushManager', {
      value: mockPushManager,
      writable: true,
    })

    // Mock canvas for WebGL detection
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockWebGL),
    }
    Object.defineProperty(global, 'HTMLCanvasElement', {
      value: class {
        getContext() {
          return mockCanvas.getContext()
        }
      },
      writable: true,
    })

    // Mock document for canvas creation
    Object.defineProperty(global, 'document', {
      value: {
        createElement: vi.fn().mockReturnValue({
          getContext: vi.fn().mockReturnValue(mockWebGL),
        }),
      },
      writable: true,
    })

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

    check = new DeviceFingerprintCheck(validConfig, validState)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Constructor', () => {
    it('should create instance with valid config', () => {
      expect(check).toBeInstanceOf(DeviceFingerprintCheck)
      expect(check.getName()).toBe('Device Fingerprint Check')
      expect(check.isEnabled()).toBe(true)
    })

    it('should be disabled when device fingerprinting is disabled', () => {
      const disabledConfig = { ...validConfig, enableDeviceFingerprinting: false }
      const disabledCheck = new DeviceFingerprintCheck(disabledConfig, validState)
      expect(disabledCheck.isEnabled()).toBe(false)
    })
  })

  describe('execute', () => {
    it('should execute successfully with valid device data', async () => {
      // Mock crypto.digest to return a mock hash
      const mockDigest = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
      mockCrypto.subtle.digest.mockResolvedValue(mockDigest)

      const result = await check.execute()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.error).toBeUndefined()
      expect(validState.deviceFingerprint).toBeDefined()
    })

    it('should handle crypto API errors gracefully', async () => {
      mockCrypto.subtle.digest.mockRejectedValue(new Error('Crypto API not available'))

      const result = await check.execute()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(validState.deviceFingerprint).toBeNull()
    })

    it('should handle navigator API errors gracefully', async () => {
      // Mock navigator to throw error
      Object.defineProperty(global, 'navigator', {
        value: {
          get language() {
            throw new Error('Navigator API error')
          },
        },
        writable: true,
      })

      const result = await check.execute()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should update progress during execution', async () => {
      const mockDigest = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
      mockCrypto.subtle.digest.mockResolvedValue(mockDigest)

      const contextBefore = check['getContext']()
      expect(contextBefore.step).toBe(SecurityCheckStep.INITIALIZING)
      expect(contextBefore.progress).toBe(0)

      await check.execute()

      const contextAfter = check['getContext']()
      expect(contextAfter.step).toBe(SecurityCheckStep.DEVICE_FINGERPRINTING)
      expect(contextAfter.progress).toBe(20)
    })

    it('should handle validation failures', async () => {
      // Mock invalid language
      Object.defineProperty(global, 'navigator', {
        value: { ...mockNavigator, language: 'invalid-language-format' },
        writable: true,
      })

      const result = await check.execute()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('collectDeviceData', () => {
    it('should collect valid device data', async () => {
      const deviceData = await check['collectDeviceData']()

      expect(deviceData.language).toBe('en-US')
      expect(deviceData.platform).toBe('MacIntel')
      expect(deviceData.timezone).toBe('America/New_York')
      expect(deviceData.hardwareConcurrency).toBe(8)
      expect(deviceData.hasPrivacyFeatures).toBeDefined()
    })

    it('should handle missing navigator properties', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      })

      const deviceData = await check['collectDeviceData']()

      expect(deviceData.language).toBe('en')
      expect(deviceData.platform).toBe('unknown')
      expect(deviceData.hardwareConcurrency).toBe(1)
    })

    it('should handle missing timezone', async () => {
      // Override the Intl mock for this test
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: vi.fn().mockReturnValue({
            resolvedOptions: vi.fn().mockReturnValue({
              timeZone: null,
            }),
          }),
        },
        writable: true,
      })

      const deviceData = await check['collectDeviceData']()

      expect(deviceData.timezone).toBe('UTC')
    })
  })

  describe('validateDeviceData', () => {
    it('should validate correct device data', () => {
      const validData = {
        language: 'en-US',
        platform: 'MacIntel',
        timezone: 'America/New_York',
        hardwareConcurrency: 8,
        hasPrivacyFeatures: {
          hasDoNotTrack: true,
          hasCookieEnabled: true,
          hasOnlineStatus: true,
          hasTouchSupport: true,
          hasWebGL: true,
          hasWebRTC: true,
          hasGeolocation: true,
          hasNotifications: true,
          hasServiceWorker: true,
          hasPushManager: true,
        },
      }

      const isValid = check['validateDeviceData'](validData)
      expect(isValid).toBe(true)
    })

    it('should reject invalid language format', () => {
      const invalidData = {
        language: 'invalid-language',
        platform: 'MacIntel',
        timezone: 'America/New_York',
        hardwareConcurrency: 8,
        hasPrivacyFeatures: {
          hasDoNotTrack: true,
          hasCookieEnabled: true,
          hasOnlineStatus: true,
          hasTouchSupport: true,
          hasWebGL: true,
          hasWebRTC: true,
          hasGeolocation: true,
          hasNotifications: true,
          hasServiceWorker: true,
          hasPushManager: true,
        },
      }

      const isValid = check['validateDeviceData'](invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject invalid platform', () => {
      const invalidData = {
        language: 'en-US',
        platform: 'InvalidPlatform',
        timezone: 'America/New_York',
        hardwareConcurrency: 8,
        hasPrivacyFeatures: {
          hasDoNotTrack: true,
          hasCookieEnabled: true,
          hasOnlineStatus: true,
          hasTouchSupport: true,
          hasWebGL: true,
          hasWebRTC: true,
          hasGeolocation: true,
          hasNotifications: true,
          hasServiceWorker: true,
          hasPushManager: true,
        },
      }

      const isValid = check['validateDeviceData'](invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject invalid timezone', () => {
      const invalidData = {
        language: 'en-US',
        platform: 'MacIntel',
        timezone: 'Invalid@Timezone#Format',
        hardwareConcurrency: 8,
        hasPrivacyFeatures: {
          hasDoNotTrack: true,
          hasCookieEnabled: true,
          hasOnlineStatus: true,
          hasTouchSupport: true,
          hasWebGL: true,
          hasWebRTC: true,
          hasGeolocation: true,
          hasNotifications: true,
          hasServiceWorker: true,
          hasPushManager: true,
        },
      }

      const isValid = check['validateDeviceData'](invalidData)
      expect(isValid).toBe(false)
    })

    it('should reject invalid hardware concurrency', () => {
      const invalidData = {
        language: 'en-US',
        platform: 'MacIntel',
        timezone: 'America/New_York',
        hardwareConcurrency: 100, // Too high
        hasPrivacyFeatures: {
          hasDoNotTrack: true,
          hasCookieEnabled: true,
          hasOnlineStatus: true,
          hasTouchSupport: true,
          hasWebGL: true,
          hasWebRTC: true,
          hasGeolocation: true,
          hasNotifications: true,
          hasServiceWorker: true,
          hasPushManager: true,
        },
      }

      const isValid = check['validateDeviceData'](invalidData)
      expect(isValid).toBe(false)
    })
  })

  describe('checkPrivacyFeatures', () => {
    it('should check all privacy features', () => {
      const features = check['checkPrivacyFeatures']()

      expect(features.hasDoNotTrack).toBeDefined()
      expect(features.hasCookieEnabled).toBeDefined()
      expect(features.hasOnlineStatus).toBeDefined()
      expect(features.hasTouchSupport).toBeDefined()
      expect(features.hasWebGL).toBeDefined()
      expect(features.hasWebRTC).toBeDefined()
      expect(features.hasGeolocation).toBeDefined()
      expect(features.hasNotifications).toBeDefined()
      expect(features.hasServiceWorker).toBeDefined()
      expect(features.hasPushManager).toBeDefined()
    })

    it('should handle missing APIs gracefully', () => {
      // Remove some APIs
      Object.defineProperty(global, 'RTCPeerConnection', {
        value: undefined,
        writable: true,
      })

      Object.defineProperty(global, 'geolocation', {
        value: undefined,
        writable: true,
      })

      const features = check['checkPrivacyFeatures']()

      expect(features.hasWebRTC).toBe(false)
      expect(features.hasGeolocation).toBe(false)
    })
  })

  describe('safeBooleanCheck', () => {
    it('should return true for successful check', () => {
      const result = check['safeBooleanCheck'](() => true)
      expect(result).toBe(true)
    })

    it('should return false for failed check', () => {
      const result = check['safeBooleanCheck'](() => false)
      expect(result).toBe(false)
    })

    it('should return false for throwing function', () => {
      const result = check['safeBooleanCheck'](() => {
        throw new Error('Test error')
      })
      expect(result).toBe(false)
    })
  })

  describe('generateDeviceHash', () => {
    it('should generate hash from device data', async () => {
      const mockDigest = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
      mockCrypto.subtle.digest.mockResolvedValue(mockDigest)

      const deviceData = {
        language: 'en-US',
        platform: 'MacIntel',
        timezone: 'America/New_York',
        hardwareConcurrency: 8,
        hasPrivacyFeatures: {
          hasDoNotTrack: true,
          hasCookieEnabled: true,
          hasOnlineStatus: true,
          hasTouchSupport: true,
          hasWebGL: true,
          hasWebRTC: true,
          hasGeolocation: true,
          hasNotifications: true,
          hasServiceWorker: true,
          hasPushManager: true,
        },
      }

      const hash = await check['generateDeviceHash'](deviceData)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(mockCrypto.subtle.digest).toHaveBeenCalled()
    })

    it('should handle crypto API errors', async () => {
      mockCrypto.subtle.digest.mockRejectedValue(new Error('Crypto API error'))

      const deviceData = {
        language: 'en-US',
        platform: 'MacIntel',
        timezone: 'America/New_York',
        hardwareConcurrency: 8,
        hasPrivacyFeatures: {
          hasDoNotTrack: true,
          hasCookieEnabled: true,
          hasOnlineStatus: true,
          hasTouchSupport: true,
          hasWebGL: true,
          hasWebRTC: true,
          hasGeolocation: true,
          hasNotifications: true,
          hasServiceWorker: true,
          hasPushManager: true,
        },
      }

      await expect(check['generateDeviceHash'](deviceData)).rejects.toThrow('Crypto API error')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long strings', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          language: 'a'.repeat(200), // Very long language
        },
        writable: true,
      })

      const deviceData = await check['collectDeviceData']()
      expect(deviceData.language.length).toBeLessThanOrEqual(1000) // Should be truncated by sanitizeString
    })

    it('should handle negative hardware concurrency', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockNavigator,
          hardwareConcurrency: -1,
        },
        writable: true,
      })

      const deviceData = await check['collectDeviceData']()
      expect(deviceData.hardwareConcurrency).toBe(0) // Should be clamped to 0 by sanitizeNumber
    })

    it('should handle undefined navigator properties', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          language: undefined,
          platform: undefined,
          hardwareConcurrency: undefined,
        },
        writable: true,
      })

      const deviceData = await check['collectDeviceData']()
      expect(deviceData.language).toBe('en')
      expect(deviceData.platform).toBe('unknown')
      expect(deviceData.hardwareConcurrency).toBe(1)
    })
  })
}) 