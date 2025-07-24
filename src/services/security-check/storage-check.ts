/**
 * Storage Security Check
 * Validates secure storage capabilities with proper encryption and key management
 */

import { BaseSecurityCheck } from './base-check'
import { SecurityCheckStep } from './types'
import type { StorageStatus } from './types'

interface EncryptedData {
  data: string
  iv: string
  algorithm: string
  timestamp: number
  version: string
}

interface SecureKey {
  key: CryptoKey
  keyId: string
  createdAt: number
  expiresAt: number
}

export class StorageCheck extends BaseSecurityCheck {
  private readonly STORAGE_KEY = 'mirrorstack_secure_storage_test'
  private readonly ENCRYPTION_ALGORITHM = 'AES-GCM'
  private readonly KEY_LENGTH = 256
  private readonly KEY_VERSION = 'v1'
  private readonly KEY_EXPIRY_DAYS = 30
  private masterKey: SecureKey | null = null

  getName(): string {
    return 'Storage Security Check'
  }

  isEnabled(): boolean {
    return this.config.enableStorage
  }

  async execute(): Promise<{ success: boolean; data?: StorageStatus; error?: string }> {
    try {
      this.updateProgress(SecurityCheckStep.STORAGE_CHECK, 99)

      // Check for basic storage capabilities
      const hasSessionStorage = this.checkSessionStorage()
      const hasLocalStorage = this.checkLocalStorage()

      // Test secure storage with proper encryption
      const hasSecureStorage = await this.testSecureStorage()
      const hasEncryptedStorage = await this.testEncryptedStorage()

      const storageStatus: StorageStatus = {
        hasSecureStorage,
        hasEncryptedStorage,
        hasSessionStorage,
        hasLocalStorage,
      }

      this.state.storageStatus = storageStatus
      this.updateProgress(SecurityCheckStep.STORAGE_CHECK, 100)

      return {
        success: true,
        data: storageStatus,
      }
    } catch (error) {
      const storageStatus: StorageStatus = {
        hasSecureStorage: false,
        hasEncryptedStorage: false,
        hasSessionStorage: false,
        hasLocalStorage: false,
        error: error instanceof Error ? error.message : 'Unknown storage error',
      }
      this.state.storageStatus = storageStatus
      this.updateProgress(SecurityCheckStep.STORAGE_CHECK, 100)

      const result = this.handleError(error as Error, 'Storage security check failed')
      return {
        success: result.success,
        error: result.error,
      }
    }
  }

  /**
   * Check session storage availability with validation
   */
  private checkSessionStorage(): boolean {
    try {
      const testKey = '__test_session_storage__'
      const testValue = 'test_value'

      // Validate sessionStorage is available
      if (typeof sessionStorage === 'undefined') {
        return false
      }

      sessionStorage.setItem(testKey, testValue)
      const retrieved = sessionStorage.getItem(testKey)
      sessionStorage.removeItem(testKey)

      return retrieved === testValue
    } catch (error) {
      console.warn('Session storage check failed:', error)
      return false
    }
  }

  /**
   * Check local storage availability with validation
   */
  private checkLocalStorage(): boolean {
    try {
      const testKey = '__test_local_storage__'
      const testValue = 'test_value'

      // Validate localStorage is available
      if (typeof localStorage === 'undefined') {
        return false
      }

      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)

      return retrieved === testValue
    } catch (error) {
      console.warn('Local storage check failed:', error)
      return false
    }
  }

  /**
   * Test secure storage capabilities with proper key management
   */
  private async testSecureStorage(): Promise<boolean> {
    try {
      // Check if Web Crypto API is available
      if (!window.crypto || !window.crypto.subtle) {
        return false
      }

      // Generate or retrieve master key
      const masterKey = await this.getOrGenerateMasterKey()
      if (!masterKey) {
        return false
      }

      // Test key generation and management
      const testKey = await this.generateEncryptionKey()
      return !!testKey
    } catch (error) {
      console.warn('Secure storage test failed:', error)
      return false
    }
  }

  /**
   * Test encrypted storage capabilities with proper encryption
   */
  private async testEncryptedStorage(): Promise<boolean> {
    try {
      if (!window.crypto || !window.crypto.subtle) {
        return false
      }

      // Get or generate master key
      const masterKey = await this.getOrGenerateMasterKey()
      if (!masterKey) {
        return false
      }

      // Test data to encrypt
      const testData = 'MirrorStack Secure Storage Test'
      const encoder = new TextEncoder()
      const data = encoder.encode(testData)

      // Generate IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12))

      // Encrypt data
      const encrypted = await window.crypto.subtle.encrypt(
        { name: this.ENCRYPTION_ALGORITHM, iv },
        masterKey.key,
        data,
      )

      // Store encrypted data with metadata
      const encryptedData: EncryptedData = {
        data: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        algorithm: this.ENCRYPTION_ALGORITHM,
        timestamp: Date.now(),
        version: this.KEY_VERSION,
      }

      // Store with key rotation check
      await this.storeEncryptedData(this.STORAGE_KEY, encryptedData)

      // Retrieve and decrypt data
      const retrievedData = await this.retrieveEncryptedData(this.STORAGE_KEY)
      if (!retrievedData) {
        return false
      }

      const encryptedBuffer = this.base64ToArrayBuffer(retrievedData.data)
      const ivBuffer = this.base64ToArrayBuffer(retrievedData.iv)

      const decrypted = await window.crypto.subtle.decrypt(
        { name: this.ENCRYPTION_ALGORITHM, iv: ivBuffer },
        masterKey.key,
        encryptedBuffer,
      )

      const decoder = new TextDecoder()
      const decryptedText = decoder.decode(decrypted)

      // Clean up test data
      await this.removeEncryptedData(this.STORAGE_KEY)

      return decryptedText === testData
    } catch (error) {
      console.warn('Encrypted storage test failed:', error)
      return false
    }
  }

  /**
   * Get or generate master key with proper key management
   */
  private async getOrGenerateMasterKey(): Promise<SecureKey | null> {
    try {
      // Check if we have a valid master key
      if (this.masterKey && this.isKeyValid(this.masterKey)) {
        return this.masterKey
      }

      // Try to retrieve from secure storage
      const storedKeyData = localStorage.getItem('mirrorstack_master_key')
      if (storedKeyData) {
        const keyData = JSON.parse(storedKeyData)
        if (this.validateKeyData(keyData)) {
          // Reconstruct key from stored data
          const key = await this.reconstructKey(keyData)
          if (key) {
            this.masterKey = {
              key,
              keyId: keyData.keyId,
              createdAt: keyData.createdAt,
              expiresAt: keyData.expiresAt,
            }
            return this.masterKey
          }
        }
      }

      // Generate new master key
      const key = await window.crypto.subtle.generateKey(
        {
          name: this.ENCRYPTION_ALGORITHM,
          length: this.KEY_LENGTH,
        },
        true,
        ['encrypt', 'decrypt'],
      )

      const keyId = await this.generateKeyId()
      const now = Date.now()
      const expiresAt = now + this.KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000

      this.masterKey = {
        key,
        keyId,
        createdAt: now,
        expiresAt,
      }

      // Store key metadata (not the actual key)
      const keyMetadata = {
        keyId,
        createdAt: now,
        expiresAt,
        version: this.KEY_VERSION,
      }

      localStorage.setItem('mirrorstack_master_key', JSON.stringify(keyMetadata))

      return this.masterKey
    } catch (error) {
      console.error('Failed to get or generate master key:', error)
      return null
    }
  }

  /**
   * Generate encryption key
   */
  private async generateEncryptionKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: this.ENCRYPTION_ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt'],
    )
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
   * Validate key data structure
   */
  private validateKeyData(
    keyData: unknown,
  ): keyData is { keyId: string; createdAt: number; expiresAt: number; version: string } {
    if (!keyData || typeof keyData !== 'object') {
      return false
    }

    const data = keyData as Record<string, unknown>
    const requiredFields = ['keyId', 'createdAt', 'expiresAt', 'version']
    for (const field of requiredFields) {
      if (!(field in data)) {
        return false
      }
    }

    if (typeof data.keyId !== 'string' || data.keyId.length !== 32) {
      return false
    }

    if (typeof data.createdAt !== 'number' || typeof data.expiresAt !== 'number') {
      return false
    }

    if (data.version !== this.KEY_VERSION) {
      return false
    }

    return true
  }

  /**
   * Reconstruct key from stored data
   */
  private async reconstructKey(keyData: {
    keyId: string
    createdAt: number
    expiresAt: number
    version: string
  }): Promise<CryptoKey | null> {
    try {
      // For this implementation, we'll generate a new key since we can't store the actual key
      // In a real implementation, you'd use a key derivation function or secure key storage
      return await this.generateEncryptionKey()
    } catch (error) {
      console.error('Failed to reconstruct key:', error)
      return null
    }
  }

  /**
   * Check if key is still valid
   */
  private isKeyValid(key: SecureKey): boolean {
    return Date.now() < key.expiresAt
  }

  /**
   * Store encrypted data securely
   */
  private async storeEncryptedData(key: string, data: EncryptedData): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to store encrypted data:', error)
      throw error
    }
  }

  /**
   * Retrieve encrypted data securely
   */
  private async retrieveEncryptedData(key: string): Promise<EncryptedData | null> {
    try {
      const storedData = localStorage.getItem(key)
      if (!storedData) {
        return null
      }

      const data = JSON.parse(storedData)
      if (!this.validateEncryptedData(data)) {
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error)
      return null
    }
  }

  /**
   * Remove encrypted data securely
   */
  private async removeEncryptedData(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove encrypted data:', error)
    }
  }

  /**
   * Validate encrypted data structure
   */
  private validateEncryptedData(data: unknown): data is EncryptedData {
    if (!data || typeof data !== 'object') {
      return false
    }

    const encryptedData = data as Record<string, unknown>
    const requiredFields = ['data', 'iv', 'algorithm', 'timestamp', 'version']
    for (const field of requiredFields) {
      if (!(field in encryptedData)) {
        return false
      }
    }

    if (typeof encryptedData.data !== 'string' || typeof encryptedData.iv !== 'string') {
      return false
    }

    if (
      typeof encryptedData.algorithm !== 'string' ||
      encryptedData.algorithm !== this.ENCRYPTION_ALGORITHM
    ) {
      return false
    }

    if (typeof encryptedData.timestamp !== 'number') {
      return false
    }

    if (typeof encryptedData.version !== 'string' || encryptedData.version !== this.KEY_VERSION) {
      return false
    }

    return true
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}
