/**
 * Security Check Orchestrator
 * Manages and coordinates all security checks with comprehensive input validation
 */

import type { SecurityCheckConfig, SecurityCheckState } from './types'
import { SecurityCheckStep } from './types'
import { BaseSecurityCheck } from './base-check'
import { DeviceFingerprintCheck } from './device-fingerprint-check'
import { HSMCheck } from './hsm-check'
import { BiometricCheck } from './biometric-check'
import { ZKPCheck } from './zkp-check'
import { CSPCheck } from './csp-check'
import { TLSCheck } from './tls-check'
import { HeadersCheck } from './headers-check'
import { CryptoCheck } from './crypto-check'
import { StorageCheck } from './storage-check'
import { DOMSkimmingCheck } from './dom-skimming-check'

export class SecurityCheckOrchestrator {
  private config: SecurityCheckConfig
  private state: SecurityCheckState
  private checks: BaseSecurityCheck[]
  private isRunning: boolean = false
  private interval: number | undefined

  constructor(config: SecurityCheckConfig) {
    this.validateConfig(config)
    this.config = config
    this.state = this.initializeState()
    this.checks = this.initializeChecks()
  }

  /**
   * Comprehensive configuration validation to prevent security issues
   */
  private validateConfig(config: SecurityCheckConfig): void {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error('Invalid security check configuration: must be a non-array object')
    }

    // Validate timeout with strict bounds
    if (
      typeof config.timeoutMs !== 'number' ||
      !Number.isInteger(config.timeoutMs) ||
      config.timeoutMs < 1000 ||
      config.timeoutMs > 60000
    ) {
      throw new Error('Invalid timeout configuration: must be integer between 1000-60000ms')
    }

    // Validate retry attempts with strict bounds
    if (
      typeof config.retryAttempts !== 'number' ||
      !Number.isInteger(config.retryAttempts) ||
      config.retryAttempts < 0 ||
      config.retryAttempts > 10
    ) {
      throw new Error('Invalid retry attempts configuration: must be integer between 0-10')
    }

    // Validate delay with strict bounds
    if (
      typeof config.delayMs !== 'number' ||
      !Number.isInteger(config.delayMs) ||
      config.delayMs < 0 ||
      config.delayMs > 10000
    ) {
      throw new Error('Invalid delay configuration: must be integer between 0-10000ms')
    }

    // Validate all boolean flags with strict type checking
    const booleanFlags = [
      'enableHSM',
      'enableBiometric',
      'enableDeviceFingerprinting',
      'enableZKP',
      'enableCSP',
      'enableTLS',
      'enableHeaders',
      'enableCrypto',
      'enableStorage',
      'enableDOMProtection',
    ]

    for (const flag of booleanFlags) {
      if (typeof config[flag as keyof SecurityCheckConfig] !== 'boolean') {
        throw new Error(`Invalid configuration for ${flag}: must be boolean`)
      }
    }

    // Validate no unexpected properties
    const expectedKeys = [...booleanFlags, 'timeoutMs', 'retryAttempts', 'delayMs']
    const actualKeys = Object.keys(config)
    const unexpectedKeys = actualKeys.filter((key) => !expectedKeys.includes(key))

    if (unexpectedKeys.length > 0) {
      throw new Error(`Invalid configuration: unexpected properties: ${unexpectedKeys.join(', ')}`)
    }
  }

  /**
   * Initialize the security check state with proper validation
   */
  private initializeState(): SecurityCheckState {
    return {
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
        hasSecureRandom: false,
        hasSubtleCrypto: false,
        hasKeyGeneration: false,
        hasEncryption: false,
      },
      storageStatus: {
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
  }

  /**
   * Initialize all security checks with validation
   */
  private initializeChecks(): BaseSecurityCheck[] {
    const checks = [
      new DeviceFingerprintCheck(this.config, this.state),
      new HSMCheck(this.config, this.state),
      new BiometricCheck(this.config, this.state),
      new ZKPCheck(this.config, this.state),
      new CSPCheck(this.config, this.state),
      new TLSCheck(this.config, this.state),
      new HeadersCheck(this.config, this.state),
      new CryptoCheck(this.config, this.state),
      new StorageCheck(this.config, this.state),
      new DOMSkimmingCheck(this.config, this.state),
    ]

    // Validate all checks were created successfully
    if (!Array.isArray(checks) || checks.length === 0) {
      throw new Error('Failed to initialize security checks')
    }

    for (const check of checks) {
      if (!check || typeof check.execute !== 'function') {
        throw new Error('Invalid security check initialization')
      }
    }

    return checks
  }

  /**
   * Start the comprehensive security check process with enhanced security
   */
  public async startSecurityCheck(): Promise<SecurityCheckState> {
    if (this.isRunning) {
      throw new Error('Security check is already running')
    }

    try {
      this.isRunning = true
      this.state.isChecking = true
      this.state.error = null
      this.state.progress = 0

      // Execute all enabled checks sequentially with proper error handling
      for (const check of this.checks) {
        if (check.isEnabled()) {
          try {
            await this.executeCheckWithTimeout(check)
            await this.delay() // Use config delay between checks
          } catch (error) {
            console.warn(`${check.getName()} failed:`, error)
            // Continue with other checks even if one fails
            await this.delay() // Use config delay even on failure
          }
        }
      }

      this.state.currentStep = SecurityCheckStep.COMPLETED
      this.state.progress = 100
      this.state.isChecking = false
      this.isRunning = false

      return this.state
    } catch (error) {
      this.handleError(error as Error)
      this.isRunning = false
      throw error
    }
  }

  /**
   * Execute a security check with timeout protection
   */
  private async executeCheckWithTimeout(check: BaseSecurityCheck): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${check.getName()} timed out after ${this.config.timeoutMs}ms`))
      }, this.config.timeoutMs)
    })

    const checkPromise = check.execute()

    await Promise.race([checkPromise, timeoutPromise])
  }

  /**
   * Delay between checks to prevent overwhelming the system
   */
  private async delay(): Promise<void> {
    if (this.config.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delayMs))
    }
  }

  /**
   * Handle errors securely without information disclosure
   */
  private handleError(error: Error): void {
    this.state.currentStep = SecurityCheckStep.ERROR
    this.state.isChecking = false
    this.isRunning = false

    // Sanitize error message to prevent information disclosure
    const sanitizedError = this.sanitizeErrorMessage(error.message)
    this.state.error = sanitizedError

    console.error('Security check failed:', sanitizedError)
  }

  /**
   * Sanitize error messages to prevent information disclosure
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potentially sensitive information
    const sensitivePatterns = [
      /private.*key/gi,
      /password/gi,
      /secret/gi,
      /token/gi,
      /api.*key/gi,
      /file.*path/gi,
      /system.*path/gi,
    ]

    let sanitized = message
    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    }

    // Limit message length
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200) + '...'
    }

    return sanitized
  }

  /**
   * Get current state with validation
   */
  public getState(): SecurityCheckState {
    // Validate state before returning
    if (!this.state || typeof this.state !== 'object') {
      throw new Error('Invalid security check state')
    }

    return { ...this.state } // Return copy to prevent external modification
  }

  /**
   * Get current configuration with validation
   */
  public getConfig(): SecurityCheckConfig {
    // Validate config before returning
    if (!this.config || typeof this.config !== 'object') {
      throw new Error('Invalid security check configuration')
    }

    return { ...this.config } // Return copy to prevent external modification
  }

  /**
   * Update configuration with validation
   */
  public updateConfig(newConfig: Partial<SecurityCheckConfig>): void {
    if (!newConfig || typeof newConfig !== 'object') {
      throw new Error('Invalid configuration update')
    }

    // Create merged config
    const mergedConfig = { ...this.config, ...newConfig }

    // Validate the merged config
    this.validateConfig(mergedConfig)

    // Update config
    this.config = mergedConfig
  }

  /**
   * Reset state securely
   */
  public reset(): void {
    this.isRunning = false
    this.state = this.initializeState()

    // Clear any intervals
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }

  /**
   * Start progress simulation (for UI feedback)
   */
  public startProgressSimulation(callback: (progress: number) => void): void {
    this.interval = window.setInterval(() => {
      if (this.state.progress < 100) {
        this.state.progress += Math.random() * 5
        callback(this.state.progress)
      }
    }, 500)
  }

  /**
   * Stop progress simulation
   */
  public stopProgressSimulation(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  }

  /**
   * Get comprehensive security status summary with validation
   */
  public getSecurityStatus(): {
    overallStatus: 'secure' | 'warning' | 'error'
    deviceFingerprint: boolean
    hsmStatus: boolean
    biometricStatus: boolean
    zkpStatus: boolean
    cspStatus: boolean
    tlsStatus: boolean
    headersStatus: boolean
    cryptoStatus: boolean
    storageStatus: boolean
    domSkimmingStatus: boolean
  } {
    // Validate state before calculating status
    if (!this.state || typeof this.state !== 'object') {
      throw new Error('Invalid security check state for status calculation')
    }

    const deviceFingerprint = !!this.state.deviceFingerprint
    const hsmStatus = this.state.hsmStatus.isAvailable && this.state.hsmStatus.isInitialized
    const biometricStatus = this.state.biometricStatus.isSupported
    const zkpStatus = this.state.zkpStatus.isReady
    const cspStatus = this.state.cspStatus.isEnabled && this.state.cspStatus.hasSecurePolicy
    const tlsStatus = this.state.tlsStatus.isSecure && this.state.tlsStatus.hasValidCertificate
    const headersStatus =
      this.state.headersStatus.hasXFrameOptions && this.state.headersStatus.hasXContentTypeOptions
    const cryptoStatus =
      this.state.cryptoStatus.hasSubtleCrypto && this.state.cryptoStatus.hasSecureRandom
    const storageStatus = this.state.storageStatus.hasSecureStorage
    const domSkimmingStatus = this.state.domSkimmingStatus.isProtected

    const secureCount = [
      deviceFingerprint,
      hsmStatus,
      biometricStatus,
      zkpStatus,
      cspStatus,
      tlsStatus,
      headersStatus,
      cryptoStatus,
      storageStatus,
      domSkimmingStatus,
    ].filter(Boolean).length

    let overallStatus: 'secure' | 'warning' | 'error' = 'error'

    if (secureCount >= 8) {
      overallStatus = 'secure'
    } else if (secureCount >= 6) {
      overallStatus = 'warning'
    }

    return {
      overallStatus,
      deviceFingerprint,
      hsmStatus,
      biometricStatus,
      zkpStatus,
      cspStatus,
      tlsStatus,
      headersStatus,
      cryptoStatus,
      storageStatus,
      domSkimmingStatus,
    }
  }
}
