import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CryptoCheck } from '../crypto-check'
import { SecurityCheckStep } from '../types'

// Mock crypto API
const mockCrypto = {
  getRandomValues: vi.fn(),
  subtle: {
    digest: vi.fn(),
    generateKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  },
}

// Mock window.crypto
Object.defineProperty(window, 'crypto', {
  writable: true,
  value: mockCrypto,
})

describe('CryptoCheck', () => {
  let cryptoCheck: CryptoCheck
  let mockConfig: any
  let mockState: any
  let mockUpdateProgress: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Re-setup window.crypto mock
    Object.defineProperty(window, 'crypto', {
      writable: true,
      value: mockCrypto,
    })

    // Mock configuration with valid timeout values
    mockConfig = {
      enableCrypto: true,
      enableHSM: true,
      enableBiometric: true,
      enableDeviceFingerprinting: true,
      enableZKP: true,
      enableCSP: true,
      enableTLS: true,
      enableHeaders: true,
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

    mockState = {
      isChecking: false,
      currentStep: SecurityCheckStep.INITIALIZING,
      progress: 0,
      error: null,
      cryptoStatus: {
        hasSecureRandom: false,
        hasSubtleCrypto: false,
        hasKeyGeneration: false,
        hasEncryption: false,
        error: null
      }
    }

    mockUpdateProgress = vi.fn()

    cryptoCheck = new CryptoCheck(mockConfig, mockState)
    cryptoCheck['updateProgress'] = mockUpdateProgress
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Initialization', () => {
    it('initializes with correct name', () => {
      expect(cryptoCheck.getName()).toBe('Crypto Check')
    })

    it('is enabled when configured', () => {
      expect(cryptoCheck.isEnabled()).toBe(true)
    })

    it('is disabled when not configured', () => {
      const disabledConfig = { ...mockConfig, enableCrypto: false }
      const disabledCryptoCheck = new CryptoCheck(disabledConfig, mockState)
      expect(disabledCryptoCheck.isEnabled()).toBe(false)
    })
  })

  describe('Execute Method', () => {
    it('updates progress correctly', async () => {
      // Mock successful crypto operations
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('test'))

      await cryptoCheck.execute()

      expect(mockUpdateProgress).toHaveBeenCalledWith(SecurityCheckStep.CRYPTO_CHECK, expect.any(Number))
    })

    it('returns success with crypto status when all tests pass', async () => {
      // Mock successful crypto operations
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('MirrorStack Crypto Test'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        isAvailable: true,
        hasSecureRandom: true,
        hasSubtleCrypto: true,
        hasKeyGeneration: true,
        hasEncryption: true,
        error: undefined
      })
    })

    it('updates state with crypto status', async () => {
      // Mock successful crypto operations
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('MirrorStack Crypto Test'))

      await cryptoCheck.execute()

      expect(mockState.cryptoStatus).toEqual({
        isAvailable: true,
        hasSecureRandom: true,
        hasSubtleCrypto: true,
        hasKeyGeneration: true,
        hasEncryption: true,
        error: undefined
      })
    })

    it('returns error when crypto API is not available', async () => {
      // Mock crypto not available
      Object.defineProperty(window, 'crypto', {
        writable: true,
        value: undefined,
      })

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Crypto API check failed')
    })

    it('handles crypto test errors gracefully', async () => {
      // Mock crypto error
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error('Crypto error')
      })

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Crypto API check failed')
    })
  })

  describe('Secure Random Tests', () => {
    it('passes when getRandomValues returns varied values', async () => {
      // Mock all crypto operations to succeed
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('MirrorStack Crypto Test'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(true)
      expect(result.data?.hasSecureRandom).toBe(true)
    })

    it('fails when getRandomValues returns all zeros', async () => {
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([0, 0, 0, 0, 0]))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasSecureRandom).toBe(false)
    })

    it('fails when getRandomValues throws error', async () => {
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error('Random generation failed')
      })

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Crypto API check failed')
    })

    it('fails when getRandomValues is not available', async () => {
      // Mock crypto without getRandomValues
      const mockCryptoWithoutRandom = {
        ...mockCrypto,
        getRandomValues: undefined
      }
      Object.defineProperty(window, 'crypto', {
        writable: true,
        value: mockCryptoWithoutRandom,
      })

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasSecureRandom).toBe(false)
    })
  })

  describe('Subtle Crypto Tests', () => {
    it('passes when subtle crypto digest works', async () => {
      // Mock all crypto operations to succeed
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('MirrorStack Crypto Test'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(true)
      expect(result.data?.hasSubtleCrypto).toBe(true)
    })

    it('fails when subtle crypto is not available', async () => {
      // Mock crypto without subtle
      const mockCryptoWithoutSubtle = {
        ...mockCrypto,
        subtle: undefined
      }
      Object.defineProperty(window, 'crypto', {
        writable: true,
        value: mockCryptoWithoutSubtle,
      })

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasSubtleCrypto).toBe(false)
    })

    it('fails when digest throws error', async () => {
      mockCrypto.subtle.digest.mockRejectedValue(new Error('Digest failed'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasSubtleCrypto).toBe(false)
    })

    it('fails when digest returns wrong size', async () => {
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(16)) // Wrong size

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasSubtleCrypto).toBe(false)
    })
  })

  describe('Key Generation Tests', () => {
    it('passes when all key generation algorithms work', async () => {
      // Mock all crypto operations to succeed
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('MirrorStack Crypto Test'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(true)
      expect(result.data?.hasKeyGeneration).toBe(true)
    })

    it('fails when RSA key generation fails', async () => {
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('RSA generation failed'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasKeyGeneration).toBe(false)
    })

    it('fails when ECDSA key generation fails', async () => {
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('ECDSA generation failed'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasKeyGeneration).toBe(false)
    })

    it('fails when AES key generation fails', async () => {
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('AES generation failed'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasKeyGeneration).toBe(false)
    })
  })

  describe('Encryption Tests', () => {
    it('passes when encryption and decryption work correctly', async () => {
      // Mock all crypto operations to succeed
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('MirrorStack Crypto Test'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(true)
      expect(result.data?.hasEncryption).toBe(true)
    })

    it('fails when encryption throws error', async () => {
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error('Encryption failed'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasEncryption).toBe(false)
    })

    it('fails when decryption throws error', async () => {
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasEncryption).toBe(false)
    })

    it('fails when decrypted data does not match original', async () => {
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('wrong'))

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.data?.hasEncryption).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('handles unknown errors gracefully', async () => {
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error('Unknown crypto error')
      })

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Crypto API check failed')
    })

    it('sets error in crypto status when tests fail', async () => {
      // Mock crypto to fail at the first test (secure random)
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error('Test error')
      })

      await cryptoCheck.execute()

      expect(mockState.cryptoStatus.error).toBeDefined()
      expect(mockState.cryptoStatus.error).toContain('Test error')
    })
  })

  describe('Integration with BaseSecurityCheck', () => {
    it('calls handleError from base class', async () => {
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await cryptoCheck.execute()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Crypto API check failed')
    })
  })

  describe('Test Algorithm Configuration', () => {
    it('uses correct RSA algorithm configuration', async () => {
      // Mock all crypto operations to succeed
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('MirrorStack Crypto Test'))

      await cryptoCheck.execute()

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        }),
        true,
        ['encrypt', 'decrypt']
      )
    })

    it('uses correct ECDSA algorithm configuration', async () => {
      // Mock all crypto operations to succeed
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('MirrorStack Crypto Test'))

      await cryptoCheck.execute()

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ECDSA',
          namedCurve: 'P-256'
        }),
        true,
        ['sign', 'verify']
      )
    })

    it('uses correct AES algorithm configuration', async () => {
      // Mock all crypto operations to succeed
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('MirrorStack Crypto Test'))

      await cryptoCheck.execute()

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AES-GCM',
          length: 256
        }),
        true,
        ['encrypt', 'decrypt']
      )
    })

    it('uses correct HMAC algorithm configuration', async () => {
      // Mock all crypto operations to succeed
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5]))
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32))
      mockCrypto.subtle.generateKey.mockResolvedValue({})
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16))
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode('MirrorStack Crypto Test'))

      await cryptoCheck.execute()

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'HMAC',
          hash: 'SHA-256'
        }),
        true,
        ['sign', 'verify']
      )
    })
  })
}) 