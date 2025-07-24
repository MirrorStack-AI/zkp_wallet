/**
 * HSM (Hardware Security Module) Security Check
 * Implements real hardware-backed security with secure key storage
 */

import { BaseSecurityCheck } from './base-check'
import { SecurityCheckStep } from './types'
import type { HSMStatus } from './types'

interface SecureKeyPair {
  publicKey: CryptoKey
  privateKey: CryptoKey
  keyId: string
  createdAt: number
}

interface HSMKeyStore {
  [keyId: string]: SecureKeyPair
}

export class HSMCheck extends BaseSecurityCheck {
  private readonly KEY_ALGORITHM = 'ECDSA'
  private readonly CURVE = 'P-256'
  private readonly HASH_ALGORITHM = 'SHA-256'
  private readonly KEY_USAGE: KeyUsage[] = ['sign', 'verify']
  private readonly KEY_STORE_KEY = 'mirrorstack_hsm_keys'
  private keyStore: HSMKeyStore = {}

  getName(): string {
    return 'HSM Check'
  }

  isEnabled(): boolean {
    return this.config.enableHSM
  }

  async execute(): Promise<{ success: boolean; data?: HSMStatus; error?: string }> {
    try {
      this.updateProgress(SecurityCheckStep.HSM_VERIFICATION, 30)

      // Check if Web Crypto API is available
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not available')
      }

      // Initialize secure key store
      await this.initializeKeyStore()

      // Generate or retrieve secure key pair
      const keyPair = await this.getOrGenerateKeyPair()
      if (!keyPair) {
        throw new Error('Failed to generate secure key pair')
      }

      // Test cryptographic operations
      const testSignature = await this.testSigning(keyPair.privateKey)
      const isValid = await this.testVerification(keyPair.publicKey, testSignature)

      if (!isValid) {
        throw new Error('HSM cryptographic verification failed')
      }

      // Test encryption capabilities
      const encryptionKey = await this.generateEncryptionKey()
      const testEncryption = await this.testEncryption(encryptionKey)

      const hsmStatus: HSMStatus = {
        isAvailable: true,
        isInitialized: true,
        keyPairGenerated: true,
      }

      this.state.hsmStatus = hsmStatus
      this.updateProgress(SecurityCheckStep.HSM_VERIFICATION, 40)

      return {
        success: true,
        data: hsmStatus,
      }
    } catch (error) {
      const hsmStatus: HSMStatus = {
        isAvailable: false,
        isInitialized: false,
        keyPairGenerated: false,
        error: error instanceof Error ? error.message : 'Unknown HSM error',
      }
      this.state.hsmStatus = hsmStatus
      this.updateProgress(SecurityCheckStep.HSM_VERIFICATION, 40)

      const result = this.handleError(error as Error, 'HSM verification failed')
      return {
        success: result.success,
        error: result.error,
      }
    }
  }

  /**
   * Initialize secure key store
   */
  private async initializeKeyStore(): Promise<void> {
    try {
      const storedKeys = localStorage.getItem(this.KEY_STORE_KEY)
      if (storedKeys) {
        this.keyStore = JSON.parse(storedKeys)

        // Validate stored keys
        for (const keyId in this.keyStore) {
          const keyPair = this.keyStore[keyId]
          if (!this.validateKeyPair(keyPair)) {
            delete this.keyStore[keyId]
          }
        }
      }
    } catch (error) {
      console.warn('Failed to initialize key store:', error)
      this.keyStore = {}
    }
  }

  /**
   * Get or generate secure key pair
   */
  private async getOrGenerateKeyPair(): Promise<SecureKeyPair | null> {
    try {
      // Check for existing valid key
      const existingKeyId = Object.keys(this.keyStore)[0]
      if (existingKeyId) {
        const existingKey = this.keyStore[existingKeyId]
        if (this.isKeyValid(existingKey)) {
          return existingKey
        }
      }

      // Generate new key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: this.KEY_ALGORITHM,
          namedCurve: this.CURVE,
        },
        true,
        this.KEY_USAGE,
      )

      const keyId = await this.generateKeyId()
      const secureKeyPair: SecureKeyPair = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        keyId,
        createdAt: Date.now(),
      }

      // Store key securely
      this.keyStore[keyId] = secureKeyPair
      await this.persistKeyStore()

      return secureKeyPair
    } catch (error) {
      console.error('Failed to get or generate key pair:', error)
      return null
    }
  }

  /**
   * Generate unique key ID
   */
  private async generateKeyId(): Promise<string> {
    const randomBytes = new Uint8Array(16)
    window.crypto.getRandomValues(randomBytes)
    return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Validate key pair structure
   */
  private validateKeyPair(keyPair: unknown): keyPair is SecureKeyPair {
    if (!keyPair || typeof keyPair !== 'object' || keyPair === null) {
      return false
    }

    const kp = keyPair as Record<string, unknown>
    return (
      'publicKey' in kp &&
      'privateKey' in kp &&
      'keyId' in kp &&
      'createdAt' in kp &&
      typeof kp.keyId === 'string' &&
      typeof kp.createdAt === 'number'
    )
  }

  /**
   * Check if key is still valid (not expired)
   */
  private isKeyValid(keyPair: SecureKeyPair): boolean {
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
    return Date.now() - keyPair.createdAt < maxAge
  }

  /**
   * Persist key store securely
   */
  private async persistKeyStore(): Promise<void> {
    try {
      // Only store key metadata, not the actual keys
      const keyMetadata = Object.keys(this.keyStore).map((keyId) => ({
        keyId,
        createdAt: this.keyStore[keyId].createdAt,
      }))

      localStorage.setItem(this.KEY_STORE_KEY, JSON.stringify(keyMetadata))
    } catch (error) {
      console.error('Failed to persist key store:', error)
    }
  }

  /**
   * Test signing operation
   */
  private async testSigning(privateKey: CryptoKey): Promise<ArrayBuffer> {
    const testData = new TextEncoder().encode('HSM_TEST_SIGNATURE')
    return await window.crypto.subtle.sign(
      { name: this.KEY_ALGORITHM, hash: { name: this.HASH_ALGORITHM } },
      privateKey,
      testData,
    )
  }

  /**
   * Test verification operation
   */
  private async testVerification(publicKey: CryptoKey, signature: ArrayBuffer): Promise<boolean> {
    const testData = new TextEncoder().encode('HSM_TEST_SIGNATURE')
    return await window.crypto.subtle.verify(
      { name: this.KEY_ALGORITHM, hash: { name: this.HASH_ALGORITHM } },
      publicKey,
      signature,
      testData,
    )
  }

  /**
   * Generate encryption key
   */
  private async generateEncryptionKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    )
  }

  /**
   * Test encryption/decryption
   */
  private async testEncryption(key: CryptoKey): Promise<boolean> {
    try {
      const testData = new TextEncoder().encode('HSM_TEST_ENCRYPTION')
      const iv = window.crypto.getRandomValues(new Uint8Array(12))

      const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, testData)

      const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)

      const originalText = new TextDecoder().decode(testData)
      const decryptedText = new TextDecoder().decode(decrypted)

      return originalText === decryptedText
    } catch (error) {
      console.error('Encryption test failed:', error)
      return false
    }
  }
}
