/**
 * Device Fingerprint Security Check
 * Collects minimal device data for security verification with comprehensive validation
 */

import { BaseSecurityCheck } from './base-check'
import { SecurityCheckStep } from './types'

interface DeviceData {
  language: string
  platform: string
  timezone: string
  hardwareConcurrency: number
  hasPrivacyFeatures: PrivacyFeatures
}

interface PrivacyFeatures {
  hasDoNotTrack: boolean
  hasCookieEnabled: boolean
  hasOnlineStatus: boolean
  hasTouchSupport: boolean
  hasWebGL: boolean
  hasWebRTC: boolean
  hasGeolocation: boolean
  hasNotifications: boolean
  hasServiceWorker: boolean
  hasPushManager: boolean
}

export class DeviceFingerprintCheck extends BaseSecurityCheck {
  private readonly MAX_STRING_LENGTH = 100
  private readonly MAX_HARDWARE_CONCURRENCY = 64
  private readonly VALID_LANGUAGES = /^[a-z]{2}(-[A-Z]{2})?$/
  private readonly VALID_PLATFORMS = /^(Win32|MacIntel|Linux x86_64|Linux armv7l|Linux aarch64)$/
  private readonly VALID_TIMEZONES = /^[A-Za-z_]+(\/[A-Za-z_]+)*$/

  getName(): string {
    return 'Device Fingerprint Check'
  }

  isEnabled(): boolean {
    return this.config.enableDeviceFingerprinting
  }

  async execute(): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      this.updateProgress(SecurityCheckStep.DEVICE_FINGERPRINTING, 10)

      const deviceData = await this.collectDeviceData()

      // Validate collected data
      if (!this.validateDeviceData(deviceData)) {
        throw new Error('Device data validation failed')
      }

      const deviceHash = await this.generateDeviceHash(deviceData)

      this.state.deviceFingerprint = deviceHash
      this.updateProgress(SecurityCheckStep.DEVICE_FINGERPRINTING, 20)

      return {
        success: true,
        data: deviceHash,
      }
    } catch (error) {
      this.state.deviceFingerprint = null
      this.updateProgress(SecurityCheckStep.DEVICE_FINGERPRINTING, 20)
      const result = this.handleError(error as Error, 'Device fingerprinting failed')
      return {
        success: result.success,
        error: result.error,
      }
    }
  }

  /**
   * Collect minimal device data for fingerprinting (privacy-focused)
   */
  private async collectDeviceData(): Promise<DeviceData> {
    const deviceData: DeviceData = {
      language: this.sanitizeString(navigator.language || 'en'),
      platform: this.sanitizeString(navigator.platform || 'unknown'),
      timezone: this.sanitizeString(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'),
      hardwareConcurrency: this.sanitizeNumber(navigator.hardwareConcurrency || 1),
      hasPrivacyFeatures: this.checkPrivacyFeatures(),
    }

    return deviceData
  }

  /**
   * Validate device data to prevent manipulation
   */
  private validateDeviceData(data: DeviceData): boolean {
    try {
      // Validate language
      if (!this.VALID_LANGUAGES.test(data.language)) {
        console.warn('Invalid language format:', data.language)
        return false
      }

      // Validate platform
      if (!this.VALID_PLATFORMS.test(data.platform)) {
        console.warn('Invalid platform format:', data.platform)
        return false
      }

      // Validate timezone
      if (!this.VALID_TIMEZONES.test(data.timezone)) {
        console.warn('Invalid timezone format:', data.timezone)
        return false
      }

      // Validate hardware concurrency
      if (
        data.hardwareConcurrency < 1 ||
        data.hardwareConcurrency > this.MAX_HARDWARE_CONCURRENCY
      ) {
        console.warn('Invalid hardware concurrency:', data.hardwareConcurrency)
        return false
      }

      // Validate privacy features object
      if (!this.validatePrivacyFeatures(data.hasPrivacyFeatures)) {
        console.warn('Invalid privacy features')
        return false
      }

      return true
    } catch (error) {
      console.error('Device data validation error:', error)
      return false
    }
  }

  /**
   * Validate privacy features object
   */
  private validatePrivacyFeatures(features: PrivacyFeatures): boolean {
    return (
      typeof features.hasDoNotTrack === 'boolean' &&
      typeof features.hasCookieEnabled === 'boolean' &&
      typeof features.hasOnlineStatus === 'boolean' &&
      typeof features.hasTouchSupport === 'boolean' &&
      typeof features.hasWebGL === 'boolean' &&
      typeof features.hasWebRTC === 'boolean' &&
      typeof features.hasGeolocation === 'boolean' &&
      typeof features.hasNotifications === 'boolean' &&
      typeof features.hasServiceWorker === 'boolean' &&
      typeof features.hasPushManager === 'boolean'
    )
  }

  /**
   * Check for privacy and security features
   */
  private checkPrivacyFeatures(): PrivacyFeatures {
    return {
      hasDoNotTrack: this.safeBooleanCheck(() => !!navigator.doNotTrack),
      hasCookieEnabled: this.safeBooleanCheck(() => navigator.cookieEnabled),
      hasOnlineStatus: this.safeBooleanCheck(() => 'onLine' in navigator),
      hasTouchSupport: this.safeBooleanCheck(() => 'maxTouchPoints' in navigator),
      hasWebGL: this.safeBooleanCheck(() => !!document.createElement('canvas').getContext('webgl')),
      hasWebRTC: this.safeBooleanCheck(
        () => !!(navigator as Navigator & { mediaDevices?: MediaDevices }).mediaDevices,
      ),
      hasGeolocation: this.safeBooleanCheck(() => 'geolocation' in navigator),
      hasNotifications: this.safeBooleanCheck(() => 'Notification' in window),
      hasServiceWorker: this.safeBooleanCheck(() => 'serviceWorker' in navigator),
      hasPushManager: this.safeBooleanCheck(() => 'PushManager' in window),
    }
  }

  /**
   * Safely check boolean properties
   */
  private safeBooleanCheck(checkFn: () => boolean): boolean {
    try {
      return checkFn()
    } catch (error) {
      console.warn('Boolean check failed:', error)
      return false
    }
  }

  /**
   * Generate device hash from collected data
   */
  private async generateDeviceHash(deviceData: DeviceData): Promise<string> {
    try {
      const dataString = JSON.stringify(deviceData)
      const encoder = new TextEncoder()
      const data = encoder.encode(dataString)

      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      return hashHex
    } catch (error) {
      throw new Error(`Failed to generate device hash: ${error}`)
    }
  }
}
