import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SecurityCheckOrchestrator } from '../security-check-orchestrator'
import type { SecurityCheckConfig } from '../types'

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

// Mock console methods to reduce noise
beforeEach(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('SecurityCheckOrchestrator', () => {
  const createValidConfig = (): SecurityCheckConfig => ({
    timeoutMs: 5000,
    retryAttempts: 3,
    delayMs: 100,
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
  })

  describe('Constructor and Configuration Validation', () => {
    it('should create instance with valid configuration', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      
      expect(orchestrator).toBeInstanceOf(SecurityCheckOrchestrator)
      expect(orchestrator.getConfig()).toEqual(config)
    })

    it('should throw error for null configuration', () => {
      expect(() => {
        new SecurityCheckOrchestrator(null as any)
      }).toThrow('Invalid security check configuration: must be a non-array object')
    })

    it('should throw error for array configuration', () => {
      expect(() => {
        new SecurityCheckOrchestrator([] as any)
      }).toThrow('Invalid security check configuration: must be a non-array object')
    })

    it('should throw error for invalid timeout', () => {
      const config = createValidConfig()
      config.timeoutMs = 500 // Too low
      
      expect(() => {
        new SecurityCheckOrchestrator(config)
      }).toThrow('Invalid timeout configuration: must be integer between 1000-60000ms')
    })

    it('should throw error for invalid retry attempts', () => {
      const config = createValidConfig()
      config.retryAttempts = 15 // Too high
      
      expect(() => {
        new SecurityCheckOrchestrator(config)
      }).toThrow('Invalid retry attempts configuration: must be integer between 0-10')
    })

    it('should throw error for invalid delay', () => {
      const config = createValidConfig()
      config.delayMs = 15000 // Too high
      
      expect(() => {
        new SecurityCheckOrchestrator(config)
      }).toThrow('Invalid delay configuration: must be integer between 0-10000ms')
    })

    it('should throw error for non-boolean enableHSM', () => {
      const config = createValidConfig()
      config.enableHSM = 'true' as any
      
      expect(() => {
        new SecurityCheckOrchestrator(config)
      }).toThrow('Invalid configuration for enableHSM: must be boolean')
    })
  })

  describe('State Management', () => {
    it('should initialize with correct default state', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      const state = orchestrator.getState()
      
      expect(state.isChecking).toBe(false)
      expect(state.currentStep).toBe('initializing')
      expect(state.progress).toBe(0)
      expect(state.error).toBeNull()
    })

    it('should reset state correctly', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      
      // Start a check to modify state
      orchestrator.startProgressSimulation(() => {})
      
      // Reset
      orchestrator.reset()
      const state = orchestrator.getState()
      
      expect(state.isChecking).toBe(false)
      expect(state.currentStep).toBe('initializing')
      expect(state.progress).toBe(0)
      expect(state.error).toBeNull()
    })
  })

  describe('Configuration Management', () => {
    it('should return current configuration', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      
      expect(orchestrator.getConfig()).toEqual(config)
    })

    it('should update configuration correctly', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      
      const newConfig = { timeoutMs: 10000, retryAttempts: 5 }
      orchestrator.updateConfig(newConfig)
      
      const updatedConfig = orchestrator.getConfig()
      expect(updatedConfig.timeoutMs).toBe(10000)
      expect(updatedConfig.retryAttempts).toBe(5)
      // Other properties should remain unchanged
      expect(updatedConfig.delayMs).toBe(config.delayMs)
    })

    it('should validate updated configuration', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      
      expect(() => {
        orchestrator.updateConfig({ timeoutMs: 500 } as any)
      }).toThrow('Invalid timeout configuration: must be integer between 1000-60000ms')
    })
  })

  describe('Progress Simulation', () => {
    it('should start progress simulation', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      const mockCallback = vi.fn()
      
      orchestrator.startProgressSimulation(mockCallback)
      
      // The progress simulation should call the callback immediately
      expect(mockCallback).toHaveBeenCalledWith(0)
    })

    it('should stop progress simulation', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      const mockCallback = vi.fn()
      
      orchestrator.startProgressSimulation(mockCallback)
      orchestrator.stopProgressSimulation()
      
      // The simulation should be stopped (no more callbacks)
      expect(mockCallback).toHaveBeenCalledTimes(1) // Only the initial call
    })

    it('should call progress callback with increasing values', async () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      const mockCallback = vi.fn()
      
      orchestrator.startProgressSimulation(mockCallback)
      
      // Wait a bit for the simulation to run
      await new Promise(resolve => setTimeout(resolve, 200))
      
      expect(mockCallback).toHaveBeenCalled()
      const calls = mockCallback.mock.calls
      expect(calls.length).toBeGreaterThan(0)
      
      // Check that progress values are increasing
      const progressValues = calls.map(call => call[0])
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1])
      }
    })
  })

  describe('Security Status', () => {
    it('should return security status structure', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      
      const status = orchestrator.getSecurityStatus()
      
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
      expect(status).toHaveProperty('domSkimmingStatus')
    })

    it('should return valid overall status values', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      
      const status = orchestrator.getSecurityStatus()
      
      expect(['secure', 'warning', 'error']).toContain(status.overallStatus)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      
      // Simulate an error
      const error = new Error('Test error')
      orchestrator['handleError'](error)
      
      const state = orchestrator.getState()
      expect(state.error).toBe('Test error')
    })

    it('should sanitize error messages', () => {
      const config = createValidConfig()
      const orchestrator = new SecurityCheckOrchestrator(config)
      
      const sanitized = orchestrator['sanitizeErrorMessage']('Test <script>alert("xss")</script> error')
      // The sanitization should preserve the message but limit length
      expect(sanitized).toContain('Test')
      expect(sanitized).toContain('error')
      expect(sanitized.length).toBeLessThanOrEqual(203) // 200 + '...'
    })
  })
}) 