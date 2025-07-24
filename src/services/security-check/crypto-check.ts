/**
 * Crypto API Check
 * Validates cryptographic capabilities with real encryption and key generation tests
 */

import { BaseSecurityCheck } from './base-check'
import { SecurityCheckStep } from './types'
import type { CryptoStatus } from './types'

interface CryptoTestResult {
  hasSecureRandom: boolean
  hasSubtleCrypto: boolean
  hasKeyGeneration: boolean
  hasEncryption: boolean
  error?: string
}

export class CryptoCheck extends BaseSecurityCheck {
  private readonly TEST_ALGORITHMS = {
    RSA: {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    ECDSA: { name: 'ECDSA', namedCurve: 'P-256' },
    AES: { name: 'AES-GCM', length: 256 },
    HMAC: { name: 'HMAC', hash: 'SHA-256' },
  }

  getName(): string {
    return 'Crypto API Check'
  }

  isEnabled(): boolean {
    return this.config.enableCrypto
  }

  async execute(): Promise<{ success: boolean; data?: CryptoStatus; error?: string }> {
    try {
      this.updateProgress(SecurityCheckStep.CRYPTO_CHECK, 97)

      // Perform comprehensive crypto tests
      const testResult = await this.performCryptoTests()

      const cryptoStatus: CryptoStatus = {
        hasSecureRandom: testResult.hasSecureRandom,
        hasSubtleCrypto: testResult.hasSubtleCrypto,
        hasKeyGeneration: testResult.hasKeyGeneration,
        hasEncryption: testResult.hasEncryption,
        error: testResult.error,
      }

      this.state.cryptoStatus = cryptoStatus
      this.updateProgress(SecurityCheckStep.CRYPTO_CHECK, 98)

      return {
        success: true,
        data: cryptoStatus,
      }
    } catch (error) {
      const cryptoStatus: CryptoStatus = {
        hasSecureRandom: false,
        hasSubtleCrypto: false,
        hasKeyGeneration: false,
        hasEncryption: false,
        error: error instanceof Error ? error.message : 'Unknown crypto error',
      }
      this.state.cryptoStatus = cryptoStatus
      this.updateProgress(SecurityCheckStep.CRYPTO_CHECK, 98)

      const result = this.handleError(error as Error, 'Crypto API check failed')
      return {
        success: result.success,
        error: result.error,
      }
    }
  }

  /**
   * Perform comprehensive cryptographic tests
   */
  private async performCryptoTests(): Promise<CryptoTestResult> {
    const result: CryptoTestResult = {
      hasSecureRandom: false,
      hasSubtleCrypto: false,
      hasKeyGeneration: false,
      hasEncryption: false,
    }

    try {
      // Test 1: Check if crypto object exists
      if (!window.crypto) {
        result.error = 'Crypto API not available'
        return result
      }

      // Test 2: Test secure random number generation
      result.hasSecureRandom = await this.testSecureRandom()

      // Test 3: Test subtle crypto API
      result.hasSubtleCrypto = await this.testSubtleCrypto()

      // Test 4: Test key generation
      result.hasKeyGeneration = await this.testKeyGeneration()

      // Test 5: Test encryption/decryption
      result.hasEncryption = await this.testEncryption()
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown crypto test error'
    }

    return result
  }

  /**
   * Test secure random number generation
   */
  private async testSecureRandom(): Promise<boolean> {
    try {
      if (!window.crypto.getRandomValues) {
        return false
      }

      // Generate random bytes
      const randomBytes = new Uint8Array(32)
      window.crypto.getRandomValues(randomBytes)

      // Check that we got actual random values (not all zeros)
      const hasNonZero = randomBytes.some((byte) => byte !== 0)
      const hasVariation = new Set(randomBytes).size > 1

      return hasNonZero && hasVariation
    } catch (error) {
      console.warn('Secure random test failed:', error)
      return false
    }
  }

  /**
   * Test subtle crypto API
   */
  private async testSubtleCrypto(): Promise<boolean> {
    try {
      if (!window.crypto.subtle) {
        return false
      }

      // Test basic subtle crypto operations
      const testData = new TextEncoder().encode('Crypto API Test')
      const digest = await window.crypto.subtle.digest('SHA-256', testData)

      return digest.byteLength === 32 // SHA-256 produces 32 bytes
    } catch (error) {
      console.warn('Subtle crypto test failed:', error)
      return false
    }
  }

  /**
   * Test key generation capabilities
   */
  private async testKeyGeneration(): Promise<boolean> {
    try {
      if (!window.crypto.subtle) {
        return false
      }

      // Test RSA key generation
      const rsaKey = await window.crypto.subtle.generateKey(this.TEST_ALGORITHMS.RSA, true, [
        'sign',
        'verify',
      ])

      // Test ECDSA key generation
      const ecdsaKey = await window.crypto.subtle.generateKey(this.TEST_ALGORITHMS.ECDSA, true, [
        'sign',
        'verify',
      ])

      // Test AES key generation
      const aesKey = await window.crypto.subtle.generateKey(this.TEST_ALGORITHMS.AES, true, [
        'encrypt',
        'decrypt',
      ])

      return !!(rsaKey && ecdsaKey && aesKey)
    } catch (error) {
      console.warn('Key generation test failed:', error)
      return false
    }
  }

  /**
   * Test encryption and decryption capabilities
   */
  private async testEncryption(): Promise<boolean> {
    try {
      if (!window.crypto.subtle) {
        return false
      }

      // Generate AES key for testing
      const key = await window.crypto.subtle.generateKey(this.TEST_ALGORITHMS.AES, true, [
        'encrypt',
        'decrypt',
      ])

      // Test data
      const testData = new TextEncoder().encode('MirrorStack Crypto Test')
      const iv = window.crypto.getRandomValues(new Uint8Array(12))

      // Encrypt
      const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, testData)

      // Decrypt
      const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)

      // Verify decryption
      const originalText = new TextDecoder().decode(testData)
      const decryptedText = new TextDecoder().decode(decrypted)

      return originalText === decryptedText
    } catch (error) {
      console.warn('Encryption test failed:', error)
      return false
    }
  }
}
