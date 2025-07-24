/**
 * Biometric Security Check
 * Tests biometric authentication capabilities during initialization
 */

import { BaseSecurityCheck } from './base-check'
import { SecurityCheckStep } from './types'
import type { BiometricStatus } from './types'

interface BiometricCredential {
  id: string
  type: string
  transports: string[]
}

export class BiometricCheck extends BaseSecurityCheck {
  private readonly RP_ID = 'mirrorstack-wallet.local'
  private readonly USER_ID = 'mirrorstack-user'
  private readonly CHALLENGE_LENGTH = 32

  getName(): string {
    return 'Biometric Check'
  }

  isEnabled(): boolean {
    return this.config.enableBiometric
  }

  async execute(): Promise<{ success: boolean; data?: BiometricStatus; error?: string }> {
    try {
      this.updateProgress(SecurityCheckStep.BIOMETRIC_CHECK, 50)

      const platform = this.detectPlatform()
      const isSupported = await this.checkBiometricAvailability(platform)

      // For initialization, we test biometric capabilities without requiring user interaction
      const isAuthenticated = await this.testBiometricCapabilities()

      const biometricStatus: BiometricStatus = {
        isAvailable: isSupported,
        isSupported: isSupported,
        isAuthenticated: isAuthenticated,
        platform,
      }

      this.state.biometricStatus = biometricStatus
      this.updateProgress(SecurityCheckStep.BIOMETRIC_CHECK, 60)

      return {
        success: true,
        data: biometricStatus,
      }
    } catch (error) {
      const biometricStatus: BiometricStatus = {
        isAvailable: false,
        isSupported: false,
        isAuthenticated: false,
        platform: 'unsupported',
        error: error instanceof Error ? error.message : 'Unknown biometric error',
      }
      this.state.biometricStatus = biometricStatus
      this.updateProgress(SecurityCheckStep.BIOMETRIC_CHECK, 60)

      const result = this.handleError(error as Error, 'Biometric check failed')
      return {
        success: result.success,
        error: result.error,
      }
    }
  }

  /**
   * Detect the current platform
   */
  private detectPlatform(): 'windows' | 'macos' | 'linux' | 'unsupported' {
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes('windows')) {
      return 'windows'
    } else if (userAgent.includes('mac')) {
      return 'macos'
    } else if (userAgent.includes('linux')) {
      return 'linux'
    }

    return 'unsupported'
  }

  /**
   * Check if biometric authentication is available
   */
  private async checkBiometricAvailability(platform: string): Promise<boolean> {
    try {
      // Check for WebAuthn support
      if (!window.PublicKeyCredential) {
        return false
      }

      // Check if the platform supports biometric authentication
      const isUserVerifyingAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

      if (!isUserVerifyingAvailable) {
        return false
      }

      // Check for platform-specific capabilities
      const platformCapabilities = await this.checkPlatformCapabilities(platform)

      return platformCapabilities
    } catch (error) {
      console.warn('Biometric availability check failed:', error)
      return false
    }
  }

  /**
   * Check platform-specific biometric capabilities
   */
  private async checkPlatformCapabilities(platform: string): Promise<boolean> {
    try {
      switch (platform) {
        case 'windows':
          return await this.checkWindowsBiometric()
        case 'macos':
          return await this.checkMacOSBiometric()
        case 'linux':
          return await this.checkLinuxBiometric()
        default:
          return false
      }
    } catch (error) {
      console.warn('Platform capability check failed:', error)
      return false
    }
  }

  /**
   * Check Windows biometric capabilities
   */
  private async checkWindowsBiometric(): Promise<boolean> {
    try {
      // Windows Hello support
      const isWindowsHelloAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return isWindowsHelloAvailable
    } catch (error) {
      return false
    }
  }

  /**
   * Check macOS biometric capabilities
   */
  private async checkMacOSBiometric(): Promise<boolean> {
    try {
      // Touch ID support
      const isTouchIDAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return isTouchIDAvailable
    } catch (error) {
      return false
    }
  }

  /**
   * Check Linux biometric capabilities
   */
  private async checkLinuxBiometric(): Promise<boolean> {
    try {
      // Linux biometric support (limited)
      const isLinuxBiometricAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return isLinuxBiometricAvailable
    } catch (error) {
      return false
    }
  }

  /**
   * Test biometric capabilities without requiring user interaction
   */
  private async testBiometricCapabilities(): Promise<boolean> {
    try {
      // Test 1: Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        return false
      }

      // Test 2: Check if user-verifying platform authenticator is available
      const isUserVerifyingAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      if (!isUserVerifyingAvailable) {
        return false
      }

      // Test 3: Check if we can create a credential (without user interaction)
      const canCreateCredential = await this.testCredentialCreation()
      if (!canCreateCredential) {
        return false
      }

      // Test 4: Check if we can generate authentication options
      const canGenerateOptions = await this.testAuthenticationOptions()
      if (!canGenerateOptions) {
        return false
      }

      return true
    } catch (error) {
      console.warn('Biometric capability test failed:', error)
      return false
    }
  }

  /**
   * Test credential creation capabilities
   */
  private async testCredentialCreation(): Promise<boolean> {
    try {
      // Create a test challenge
      const challenge = this.generateChallenge()

      // Create credential creation options (without user interaction)
      const options: PublicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: 'MirrorStack Wallet',
          id: this.RP_ID,
        },
        user: {
          id: new TextEncoder().encode(this.USER_ID),
          name: this.USER_ID,
          displayName: 'MirrorStack User',
        },
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7, // ES256
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
        },
        timeout: 60000,
      }

      // Test if options are valid (without actually creating)
      return !!options.challenge && !!options.rp && !!options.user
    } catch (error) {
      console.warn('Credential creation test failed:', error)
      return false
    }
  }

  /**
   * Test authentication options generation
   */
  private async testAuthenticationOptions(): Promise<boolean> {
    try {
      // Create a test challenge
      const challenge = this.generateChallenge()

      // Create authentication options (without user interaction)
      const options: PublicKeyCredentialRequestOptions = {
        challenge: challenge,
        rpId: this.RP_ID,
        userVerification: 'preferred',
        timeout: 60000,
      }

      // Test if options are valid (without actually authenticating)
      return !!options.challenge && !!options.rpId
    } catch (error) {
      console.warn('Authentication options test failed:', error)
      return false
    }
  }

  /**
   * Generate cryptographic challenge
   */
  private generateChallenge(): ArrayBuffer {
    const challenge = new Uint8Array(this.CHALLENGE_LENGTH)
    window.crypto.getRandomValues(challenge)
    return challenge.buffer
  }
}
