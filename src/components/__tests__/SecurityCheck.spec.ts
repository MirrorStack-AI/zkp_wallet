import { describe, it, expect, vi, beforeEach } from 'vitest'
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

    // Check if logo icon exists
    const logoIcon = wrapper.findComponent({ name: 'IconLogo' })
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
    it('can start and stop progress simulation', () => {
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
        timeoutMs: 30000,
        retryAttempts: 3,
        delayMs: 50,
      })

      const mockCallback = vi.fn()
      service.startProgressSimulation(mockCallback)
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
        timeoutMs: 30000,
        retryAttempts: 3,
        delayMs: 50,
      })

      // Test that sensitive data is detected
      const sensitiveData = 'password123'
      const nonSensitiveData = 'hello world'

      // This would be called by the DOM skimming check
      const domCheck = service as unknown as { validateNoDOMInjection(data: string): boolean }
      expect(domCheck.validateNoDOMInjection(sensitiveData)).toBe(false)
      expect(domCheck.validateNoDOMInjection(nonSensitiveData)).toBe(true)
    })
  })
})
