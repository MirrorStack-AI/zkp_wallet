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
import { CertificatePinningCheck } from './certificate-pinning'
import { GDPRComplianceCheck } from './gdpr-compliance'
import { ThreatDetectionCheck } from './threat-detection'
import { SOC2ComplianceCheck } from './soc2-compliance'

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
      'enableCertificatePinning',
      'enableGDPRCompliance',
      'enableThreatDetection',
      'enableSOC2Compliance',
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
      certificatePinningStatus: {
        isPinned: false,
        hasValidCertificate: false,
        hasSecureConnection: false,
        fingerprintVerified: false,
      },
      gdprComplianceStatus: {
        isCompliant: false,
        hasDataMinimization: false,
        hasConsentManagement: false,
        hasDataPortability: false,
        hasRightToErasure: false,
        hasPrivacyByDesign: false,
      },
      threatDetectionStatus: {
        isSecure: false,
        hasAnomalyDetection: false,
        hasBehavioralAnalysis: false,
        hasThreatIntelligence: false,
        threatLevel: 'low',
        detectedThreats: [],
      },
      soc2ComplianceStatus: {
        isCompliant: false,
        hasSecurityControls: false,
        hasAvailabilityControls: false,
        hasProcessingIntegrity: false,
        hasConfidentialityControls: false,
        hasPrivacyControls: false,
        auditTrail: [],
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
      new CertificatePinningCheck(this.config, this.state),
      new GDPRComplianceCheck(this.config, this.state),
      new ThreatDetectionCheck(this.config, this.state),
      new SOC2ComplianceCheck(this.config, this.state),
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
            // Update current step before executing check
            this.updateCurrentStep(check)
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
   * Simplified security check for faster execution
   */
  public async startQuickSecurityCheck(): Promise<SecurityCheckState> {
    if (this.isRunning) {
      throw new Error('Security check is already running')
    }

    try {
      this.isRunning = true
      this.state.isChecking = true
      this.state.error = null
      this.state.progress = 0

      // Only run essential checks for faster completion
      const essentialChecks = this.checks.filter(
        (check) =>
          check.isEnabled() &&
          ['DeviceFingerprintCheck', 'CryptoCheck', 'StorageCheck'].includes(
            check.constructor.name,
          ),
      )

      for (const check of essentialChecks) {
        try {
          this.updateCurrentStep(check)
          await this.executeCheckWithTimeout(check)
          await this.delay()
        } catch (error) {
          console.warn(`${check.getName()} failed:`, error)
          await this.delay()
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
   * Update current step based on the check being executed
   */
  private updateCurrentStep(check: BaseSecurityCheck): void {
    const checkName = check.constructor.name
    switch (checkName) {
      case 'DeviceFingerprintCheck':
        this.state.currentStep = SecurityCheckStep.DEVICE_FINGERPRINTING
        break
      case 'HSMCheck':
        this.state.currentStep = SecurityCheckStep.HSM_VERIFICATION
        break
      case 'BiometricCheck':
        this.state.currentStep = SecurityCheckStep.BIOMETRIC_CHECK
        break
      case 'ZKPCheck':
        this.state.currentStep = SecurityCheckStep.ZKP_INITIALIZATION
        break
      case 'CSPCheck':
        this.state.currentStep = SecurityCheckStep.CSP_VALIDATION
        break
      case 'TLSCheck':
        this.state.currentStep = SecurityCheckStep.TLS_CHECK
        break
      case 'HeadersCheck':
        this.state.currentStep = SecurityCheckStep.HEADERS_CHECK
        break
      case 'CryptoCheck':
        this.state.currentStep = SecurityCheckStep.CRYPTO_CHECK
        break
      case 'StorageCheck':
        this.state.currentStep = SecurityCheckStep.STORAGE_CHECK
        break
      case 'DOMSkimmingCheck':
        this.state.currentStep = SecurityCheckStep.DOM_PROTECTION
        break
      case 'CertificatePinningCheck':
        this.state.currentStep = SecurityCheckStep.CERTIFICATE_PINNING
        break
      case 'GDPRComplianceCheck':
        this.state.currentStep = SecurityCheckStep.GDPR_COMPLIANCE
        break
      case 'ThreatDetectionCheck':
        this.state.currentStep = SecurityCheckStep.THREAT_DETECTION
        break
      case 'SOC2ComplianceCheck':
        this.state.currentStep = SecurityCheckStep.SOC2_COMPLIANCE
        break
      default:
        console.warn('Unknown check type:', checkName)
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
    // Call callback immediately with current progress
    callback(this.state.progress)

    this.interval = window.setInterval(() => {
      // Calculate progress based on current step and completed checks
      const totalSteps = this.checks.length
      const completedSteps = this.checks.filter((check) => {
        // Check if this security check has been completed
        const checkName = check.constructor.name
        switch (checkName) {
          case 'DeviceFingerprintCheck':
            return this.state.deviceFingerprint !== null
          case 'HSMCheck':
            return this.state.hsmStatus.isAvailable && this.state.hsmStatus.isInitialized
          case 'BiometricCheck':
            return this.state.biometricStatus.isSupported
          case 'ZKPCheck':
            return this.state.zkpStatus.isReady
          case 'CSPCheck':
            return this.state.cspStatus.isEnabled
          case 'TLSCheck':
            return this.state.tlsStatus.isSecure
          case 'HeadersCheck':
            return this.state.headersStatus.hasXFrameOptions
          case 'CryptoCheck':
            return this.state.cryptoStatus.hasSubtleCrypto
          case 'StorageCheck':
            return this.state.storageStatus.hasSecureStorage
          case 'DOMSkimmingCheck':
            return this.state.domSkimmingStatus.isProtected
          case 'CertificatePinningCheck':
            return this.state.certificatePinningStatus?.isPinned || false
          case 'GDPRComplianceCheck':
            return this.state.gdprComplianceStatus?.isCompliant || false
          case 'ThreatDetectionCheck':
            return this.state.threatDetectionStatus?.isSecure || false
          case 'SOC2ComplianceCheck':
            return this.state.soc2ComplianceStatus?.isCompliant || false
          default:
            return false
        }
      }).length

      // Calculate progress percentage (0-100)
      const progressPercentage = Math.min(100, (completedSteps / totalSteps) * 100)

      // Ensure progress only moves forward
      if (progressPercentage > this.state.progress) {
        this.state.progress = progressPercentage
        callback(this.state.progress)
      }
    }, 100) // Update more frequently for smoother progress
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
