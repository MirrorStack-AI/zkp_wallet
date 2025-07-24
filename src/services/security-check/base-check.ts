/**
 * Base Security Check Class
 * Abstract base class that all security checks should extend
 */

import type {
  SecurityCheckConfig,
  SecurityCheckState,
  SecurityCheckResult,
  SecurityCheckContext,
} from './types'
import { SecurityCheckStep } from './types'

export abstract class BaseSecurityCheck {
  protected config: SecurityCheckConfig
  protected state: SecurityCheckState
  protected step: SecurityCheckStep
  protected progress: number

  constructor(config: SecurityCheckConfig, state: SecurityCheckState) {
    this.validateConfig(config)
    this.config = config
    this.state = state
    this.step = SecurityCheckStep.INITIALIZING
    this.progress = 0
  }

  /**
   * Validate configuration to prevent security issues
   */
  private validateConfig(config: SecurityCheckConfig): void {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid security check configuration')
    }

    // Validate timeout
    if (
      typeof config.timeoutMs !== 'number' ||
      config.timeoutMs < 1000 ||
      config.timeoutMs > 60000
    ) {
      throw new Error('Invalid timeout configuration')
    }

    // Validate retry attempts
    if (
      typeof config.retryAttempts !== 'number' ||
      config.retryAttempts < 0 ||
      config.retryAttempts > 10
    ) {
      throw new Error('Invalid retry attempts configuration')
    }

    // Validate delay
    if (typeof config.delayMs !== 'number' || config.delayMs < 0 || config.delayMs > 10000) {
      throw new Error('Invalid delay configuration')
    }

    // Validate boolean flags
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
        throw new Error(`Invalid configuration for ${flag}`)
      }
    }
  }

  /**
   * Get the current context for this security check
   */
  protected getContext(): SecurityCheckContext {
    return {
      config: this.config,
      state: this.state,
      step: this.step,
      progress: this.progress,
    }
  }

  /**
   * Update the current step and progress
   */
  protected updateProgress(step: SecurityCheckStep, progress: number): void {
    // Validate progress value
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      throw new Error('Invalid progress value')
    }

    this.step = step
    this.progress = progress
    this.state.currentStep = step
    this.state.progress = progress
  }

  /**
   * Utility method for delays with validation
   */
  protected delay(ms?: number): Promise<void> {
    const delayTime = ms ?? this.config.delayMs

    // Validate delay time
    if (typeof delayTime !== 'number' || delayTime < 0 || delayTime > 10000) {
      throw new Error('Invalid delay time')
    }

    return new Promise((resolve) => setTimeout(resolve, delayTime))
  }

  /**
   * Handle errors in a secure way without information disclosure
   */
  protected handleError(error: Error, errorMessage: string): SecurityCheckResult {
    // Log error for debugging (in production, use proper logging)
    console.warn(`${this.constructor.name} failed:`, error)

    // Sanitize error message to prevent information disclosure
    const sanitizedMessage = this.sanitizeErrorMessage(errorMessage)

    return {
      success: false,
      error: sanitizedMessage,
    }
  }

  /**
   * Sanitize error messages to prevent information disclosure
   */
  protected sanitizeErrorMessage(message: string): string {
    // Remove potentially sensitive information
    return message
      .replace(/[<>"'&]/g, '')
      .replace(/[^\w\s\-./]/g, '')
      .substring(0, 200) // Limit length
  }

  /**
   * Validate input data to prevent injection attacks
   */
  protected validateInput<T>(data: unknown, validator: (data: unknown) => data is T): T {
    if (!validator(data)) {
      throw new Error('Invalid input data')
    }
    return data
  }

  /**
   * Sanitize string input
   */
  protected sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    return input
      .replace(/[<>"'&]/g, '')
      .replace(/[^\w\s\-./]/g, '')
      .trim()
      .substring(0, 1000) // Limit length
  }

  /**
   * Sanitize number input
   */
  protected sanitizeNumber(input: number): number {
    if (typeof input !== 'number' || isNaN(input) || !isFinite(input)) {
      return 0
    }

    return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, input))
  }

  /**
   * Abstract method that all security checks must implement
   */
  abstract execute(): Promise<SecurityCheckResult>

  /**
   * Get the name of this security check
   */
  abstract getName(): string

  /**
   * Check if this security check is enabled in the configuration
   */
  abstract isEnabled(): boolean
}
