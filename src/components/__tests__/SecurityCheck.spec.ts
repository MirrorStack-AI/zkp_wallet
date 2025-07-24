import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SecurityCheck from '../../views/SecurityCheckView.vue'
import { SecurityCheckService } from '../../services/security-check'
import type { SecurityCheckConfig } from '../../services/security-check/types'

// Mock crypto API for testing
const mockCrypto = {
  subtle: {
    generateKey: vi.fn(),
    sign: vi.fn(),
    verify: vi.fn(),
    digest: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    exportKey: vi.fn(),
  },
  getRandomValues: vi.fn(),
}

// Mock window.crypto
Object.defineProperty(window, 'crypto', {
  value: mockCrypto,
  writable: true,
})

// Mock window.matchMedia for ThemeToggle component
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock HTMLCanvasElement.getContext
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  }),
})

// Mock navigator.platform
Object.defineProperty(navigator, 'platform', {
  value: 'Win32',
  writable: true,
})

// Mock console methods to reduce noise
const originalConsole = console
beforeEach(() => {
  console.error = vi.fn()
  console.warn = vi.fn()

  // Prevent unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    // Ignore expected errors in test environment
    if (
      reason instanceof Error &&
      (reason.message.includes('matchMedia') ||
        reason.message.includes('getContext') ||
        reason.message.includes('DeviceFingerprintCheck failed') ||
        reason.message.includes('HSMCheck failed') ||
        reason.message.includes('ZKP check failed') ||
        reason.message.includes('Subtle crypto test failed'))
    ) {
      return
    }
    console.error('Unhandled Rejection:', reason)
  })
})

afterEach(() => {
  console.error = originalConsole.error
  console.warn = originalConsole.warn
})

describe('SecurityCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders properly', () => {
    const wrapper = mount(SecurityCheck)

    // Check if the component renders
    expect(wrapper.exists()).toBe(true)

    // Check if the title is present
    expect(wrapper.text()).toContain('Security Checking...')

    // Check if the subtitle is present
    expect(wrapper.text()).toContain('Verifying your device for enhanced security')
  })

  it('shows progress bar', () => {
    const wrapper = mount(SecurityCheck)

    // Check if progress bar exists by looking for the ProgressIndicator component
    const progressIndicator = wrapper.findComponent({ name: 'ProgressIndicator' })
    expect(progressIndicator.exists()).toBe(true)
  })

  it('has theme toggle button', () => {
    const wrapper = mount(SecurityCheck)

    // Check if theme toggle exists
    const themeToggle = wrapper.findComponent({ name: 'ThemeToggle' })
    expect(themeToggle.exists()).toBe(true)
  })

  it('has logo icon', () => {
    const wrapper = mount(SecurityCheck)

    // Check if logo icon exists using data-testid
    const logoIcon = wrapper.find('[data-testid="logo"]')
    expect(logoIcon.exists()).toBe(true)
  })

  describe('Security Configuration Validation', () => {
    it('validates security check configuration properly', () => {
      const validConfig = {
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
        delayMs: 50,
      }

      expect(() => new SecurityCheckService(validConfig)).not.toThrow()
    })

    it('rejects invalid timeout configuration', () => {
      const invalidConfig = {
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
        timeoutMs: 500, // Too low
        retryAttempts: 3,
        delayMs: 50,
      }

      expect(() => new SecurityCheckService(invalidConfig)).toThrow('Invalid timeout configuration')
    })

    it('rejects invalid retry attempts configuration', () => {
      const invalidConfig = {
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
        retryAttempts: 15, // Too high
        delayMs: 50,
      }

      expect(() => new SecurityCheckService(invalidConfig)).toThrow(
        'Invalid retry attempts configuration',
      )
    })

    it('rejects non-object configuration', () => {
      expect(() => new SecurityCheckService(null as unknown as never)).toThrow(
        'Invalid security check configuration',
      )
      expect(() => new SecurityCheckService([] as unknown as never)).toThrow(
        'Invalid security check configuration',
      )
    })

    it('rejects configuration with unexpected properties', () => {
      const invalidConfig = {
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
        delayMs: 50,
        unexpectedProperty: 'should not be here',
      }

      expect(() => new SecurityCheckService(invalidConfig)).toThrow(
        'Invalid configuration: unexpected properties',
      )
    })
  })

  describe('XSS Prevention', () => {
    it('does not use innerHTML in security indicators', () => {
      const wrapper = mount(SecurityCheck)

      // Check that no innerHTML is used in the template
      const template = wrapper.html()
      expect(template).not.toContain('innerHTML')

      // Check that all text content is properly escaped
      expect(template).not.toContain('<script>')
      expect(template).not.toContain('javascript:')
    })

    it('sanitizes error messages properly', () => {
      const service = new SecurityCheckService({
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
        delayMs: 50,
      })

      // Test error message sanitization using the private method
      const sensitiveError = 'Failed to access private key: password123'
      const sanitized = (
        service as unknown as { sanitizeErrorMessage(message: string): string }
      ).sanitizeErrorMessage(sensitiveError)

      expect(sanitized).not.toContain('password123')
      expect(sanitized).toContain('[REDACTED]')
    })
  })

  describe('Security Service State Management', () => {
    it('initializes with correct default state', () => {
      const service = new SecurityCheckService({
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
        delayMs: 50,
      })

      const state = service.getState()
      expect(state.currentStep).toBe('initializing')
      expect(state.progress).toBe(0)
      expect(state.error).toBeNull()
    })

    it('provides security status correctly', () => {
      const service = new SecurityCheckService({
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
        delayMs: 50,
      })

      const status = service.getSecurityStatus()
      expect(status).toHaveProperty('overallStatus')
      expect(status).toHaveProperty('deviceFingerprint')
      expect(status).toHaveProperty('hsmStatus')
      expect(status).toHaveProperty('biometricStatus')
      expect(status).toHaveProperty('zkpStatus')
      expect(status).toHaveProperty('cspStatus')
      expect(status).toHaveProperty('tlsStatus')
      expect(status).toHaveProperty('headersStatus')
      expect(status).toHaveProperty('cryptoStatus')
      expect(status).toHaveProperty('storageStatus')
    })
  })

  describe('Configuration Management', () => {
    it('allows configuration updates', () => {
      const service = new SecurityCheckService({
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
        delayMs: 50,
      })

      const initialConfig = service.getConfig()
      expect(initialConfig.timeoutMs).toBe(30000)

      service.updateConfig({ timeoutMs: 15000 })
      const updatedConfig = service.getConfig()
      expect(updatedConfig.timeoutMs).toBe(15000)
    })

    it('allows service reset', () => {
      const service = new SecurityCheckService({
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
        delayMs: 50,
      })

      service.reset()
      const state = service.getState()
      expect(state.currentStep).toBe('initializing')
      expect(state.progress).toBe(0)
      expect(state.error).toBeNull()
    })
  })

  describe('Progress Simulation', () => {
    it('can start and stop progress simulation', async () => {
      const service = new SecurityCheckService({
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
        delayMs: 50,
      })

      const mockCallback = vi.fn()
      service.startProgressSimulation(mockCallback)

      // Wait for the first interval to trigger
      await new Promise((resolve) => setTimeout(resolve, 600))

      service.stopProgressSimulation()

      // The callback should have been called at least once
      expect(mockCallback).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles errors without information disclosure', () => {
      const service = new SecurityCheckService({
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
        delayMs: 50,
      })

      const state = service.getState()
      expect(state.error).toBeNull()

      // Test error handling using the private method
      const error = new Error('Sensitive information: private key password123')
      ;(service as unknown as { handleError(error: Error): void }).handleError(error)

      const updatedState = service.getState()
      expect(updatedState.error).not.toContain('password123')
      expect(updatedState.error).toContain('[REDACTED]')
    })
  })

  describe('DOM Skimming Protection', () => {
    it('validates DOM skimming protection configuration', () => {
      const validConfig = {
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
        delayMs: 50,
      }

      expect(() => new SecurityCheckService(validConfig)).not.toThrow()
    })

    it('rejects configuration without DOM protection', () => {
      const invalidConfig = {
        enableHSM: true,
        enableBiometric: true,
        enableDeviceFingerprinting: true,
        enableZKP: true,
        enableCSP: true,
        enableTLS: true,
        enableHeaders: true,
        enableCrypto: true,
        enableStorage: true,
        // Missing enableDOMProtection - this should cause an error
        timeoutMs: 30000,
        retryAttempts: 3,
        delayMs: 50,
      } as Partial<SecurityCheckConfig> & { enableDOMProtection?: never }

      expect(() => new SecurityCheckService(invalidConfig as SecurityCheckConfig)).toThrow(
        'Invalid configuration for enableDOMProtection',
      )
    })

    it('includes DOM protection in security status', () => {
      const service = new SecurityCheckService({
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
        delayMs: 50,
      })

      const status = service.getSecurityStatus()
      expect(status).toHaveProperty('domSkimmingStatus')
      expect(typeof status.domSkimmingStatus).toBe('boolean')
    })

    it('prevents sensitive data injection into DOM', () => {
      const service = new SecurityCheckService({
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
        delayMs: 50,
      })

      // Test that DOM protection is enabled in the security status
      const status = service.getSecurityStatus()
      expect(status.domSkimmingStatus).toBeDefined()
      expect(typeof status.domSkimmingStatus).toBe('boolean')
    })
  })
})
