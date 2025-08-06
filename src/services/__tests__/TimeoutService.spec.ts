import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import TimeoutService, { 
  type TimeoutConfig, 
  type TimeoutState, 
  type TimeoutCallback 
} from '../TimeoutService'

describe('TimeoutService', () => {
  let timeoutService: TimeoutService
  let mockChrome: any

  beforeEach(() => {
    // Reset the singleton instance
    ;(TimeoutService as any).instance = undefined
    
    // Create fresh instance
    timeoutService = TimeoutService.getInstance()
    
    // Mock Chrome APIs
    mockChrome = {
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn()
        }
      }
    }
    
    ;(window as any).chrome = mockChrome
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    // Mock window.parent
    Object.defineProperty(window, 'parent', {
      value: window,
      writable: true
    })
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock setInterval and clearInterval
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TimeoutService.getInstance()
      const instance2 = TimeoutService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('startTimeout', () => {
    it('should start timeout successfully', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn(),
        onComplete: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(10)
      
      const startTime = Date.now()
      const result = await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)

      expect(result).toBe(10)
      expect(timeoutService.isTimeoutActive('test-timeout')).toBe(true)
    })

    it('should handle already expired timeout', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(5)
      
      const startTime = Date.now() - 10000 // 10 seconds ago
      const result = await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)

      expect(result).toBe(0)
      expect(mockCallbacks.onTimeout).toHaveBeenCalled()
      expect(timeoutService.isTimeoutActive('test-timeout')).toBe(false)
    })

    it('should clear existing timeout before starting new one', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(10)
      
      const startTime = Date.now()
      
      // Start first timeout
      await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)
      expect(timeoutService.isTimeoutActive('test-timeout')).toBe(true)
      
      // Start second timeout with same ID
      await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)
      expect(timeoutService.isTimeoutActive('test-timeout')).toBe(true)
    })

    it('should call onTick callback during countdown', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(3)
      
      const startTime = Date.now()
      await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)

      // Advance timer by 1 second
      vi.advanceTimersByTime(1000)
      expect(mockCallbacks.onTick).toHaveBeenCalledWith(2)

      // Advance timer by another second
      vi.advanceTimersByTime(1000)
      expect(mockCallbacks.onTick).toHaveBeenCalledWith(1)

      // Advance timer to trigger timeout
      vi.advanceTimersByTime(1000)
      expect(mockCallbacks.onTimeout).toHaveBeenCalled()
    })

    it('should handle timeout completion', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(2)
      
      const startTime = Date.now()
      await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)

      // Advance timer to trigger timeout
      vi.advanceTimersByTime(2000)
      
      expect(mockCallbacks.onTimeout).toHaveBeenCalled()
      expect(timeoutService.isTimeoutActive('test-timeout')).toBe(false)
    })
  })

  describe('clearTimeout', () => {
    it('should clear specific timeout', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(10)
      
      const startTime = Date.now()
      await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)
      
      expect(timeoutService.isTimeoutActive('test-timeout')).toBe(true)
      
      timeoutService.clearTimeout('test-timeout')
      
      expect(timeoutService.isTimeoutActive('test-timeout')).toBe(false)
    })

    it('should handle clearing non-existent timeout', () => {
      expect(() => timeoutService.clearTimeout('non-existent')).not.toThrow()
    })
  })

  describe('clearAllTimeouts', () => {
    it('should clear all active timeouts', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(10)
      
      const startTime = Date.now()
      await timeoutService.startTimeout('timeout-1', startTime, mockCallbacks)
      await timeoutService.startTimeout('timeout-2', startTime, mockCallbacks)
      
      expect(timeoutService.isTimeoutActive('timeout-1')).toBe(true)
      expect(timeoutService.isTimeoutActive('timeout-2')).toBe(true)
      
      timeoutService.clearAllTimeouts()
      
      expect(timeoutService.isTimeoutActive('timeout-1')).toBe(false)
      expect(timeoutService.isTimeoutActive('timeout-2')).toBe(false)
    })
  })

  describe('getRemainingTime', () => {
    it('should return remaining time for active timeout', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(10)
      
      const startTime = Date.now()
      await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)
      
      const remainingTime = timeoutService.getRemainingTime('test-timeout')
      expect(remainingTime).toBe(10)
    })

    it('should return 0 for non-existent timeout', () => {
      const remainingTime = timeoutService.getRemainingTime('non-existent')
      expect(remainingTime).toBe(0)
    })
  })

  describe('isTimeoutActive', () => {
    it('should return true for active timeout', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(10)
      
      const startTime = Date.now()
      await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)
      
      expect(timeoutService.isTimeoutActive('test-timeout')).toBe(true)
    })

    it('should return false for non-existent timeout', () => {
      expect(timeoutService.isTimeoutActive('non-existent')).toBe(false)
    })

    it('should return false for cleared timeout', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(10)
      
      const startTime = Date.now()
      await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)
      
      timeoutService.clearTimeout('test-timeout')
      
      expect(timeoutService.isTimeoutActive('test-timeout')).toBe(false)
    })
  })

  describe('getTimeoutConfig', () => {
    it('should return timeout from Chrome storage', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ extensionTimeoutSeconds: 60 })

      const result = await timeoutService.getTimeoutConfig()

      expect(result).toBe(60)
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['extensionTimeoutSeconds'])
    })

    it('should return timeout from parent window', async () => {
      mockChrome.storage.local.get.mockResolvedValue({})
      // Mock window.parent properly
      Object.defineProperty(window, 'parent', {
        value: {
          openExtensionTimeoutSeconds: 30
        },
        writable: true
      })

      const result = await timeoutService.getTimeoutConfig()

      expect(result).toBe(30)
    })

    it('should return timeout from localStorage', async () => {
      mockChrome.storage.local.get.mockResolvedValue({})
      ;(window.parent as any).openExtensionTimeoutSeconds = undefined
      ;(window.localStorage.getItem as any).mockReturnValue('45')

      const result = await timeoutService.getTimeoutConfig()

      expect(result).toBe(45)
    })

    it('should return default timeout when no configuration found', async () => {
      mockChrome.storage.local.get.mockResolvedValue({})
      ;(window.parent as any).openExtensionTimeoutSeconds = undefined
      ;(window.localStorage.getItem as any).mockReturnValue(null)

      const result = await timeoutService.getTimeoutConfig()

      expect(result).toBe(45) // default timeout
    })

    it('should handle invalid localStorage value', async () => {
      mockChrome.storage.local.get.mockResolvedValue({})
      ;(window.parent as any).openExtensionTimeoutSeconds = undefined
      ;(window.localStorage.getItem as any).mockReturnValue('invalid')

      const result = await timeoutService.getTimeoutConfig()

      expect(result).toBe(45) // should fall back to default
    })
  })

  describe('calculateRemainingTime', () => {
    it('should calculate remaining time correctly', async () => {
      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(60)
      
      const startTime = Date.now() - 30000 // 30 seconds ago
      const result = await timeoutService.calculateRemainingTime(startTime)

      expect(result).toBe(30) // 60 - 30 = 30 seconds remaining
    })

    it('should return 0 when time has expired', async () => {
      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(30)
      
      const startTime = Date.now() - 60000 // 60 seconds ago
      const result = await timeoutService.calculateRemainingTime(startTime)

      expect(result).toBe(0)
    })

    it('should handle negative remaining time', async () => {
      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(10)
      
      const startTime = Date.now() - 20000 // 20 seconds ago
      const result = await timeoutService.calculateRemainingTime(startTime)

      expect(result).toBe(0) // should be clamped to 0
    })
  })

  describe('getActiveTimeoutIds', () => {
    it('should return array of active timeout IDs', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(10)
      
      const startTime = Date.now()
      await timeoutService.startTimeout('timeout-1', startTime, mockCallbacks)
      await timeoutService.startTimeout('timeout-2', startTime, mockCallbacks)
      
      const activeIds = timeoutService.getActiveTimeoutIds()
      
      expect(activeIds).toContain('timeout-1')
      expect(activeIds).toContain('timeout-2')
      expect(activeIds).toHaveLength(2)
    })

    it('should return empty array when no timeouts are active', () => {
      const activeIds = timeoutService.getActiveTimeoutIds()
      expect(activeIds).toEqual([])
    })
  })

  describe('getTimeoutStats', () => {
    it('should return correct timeout statistics', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(10)
      
      const startTime = Date.now()
      await timeoutService.startTimeout('timeout-1', startTime, mockCallbacks)
      await timeoutService.startTimeout('timeout-2', startTime, mockCallbacks)
      
      const stats = timeoutService.getTimeoutStats()
      
      expect(stats).toEqual({
        activeCount: 2,
        totalTimeouts: 2
      })
    })

    it('should return zero stats when no timeouts are active', () => {
      const stats = timeoutService.getTimeoutStats()
      
      expect(stats).toEqual({
        activeCount: 0,
        totalTimeouts: 0
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle timeout config errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'))
      ;(window.parent as any).openExtensionTimeoutSeconds = undefined
      ;(window.localStorage.getItem as any).mockReturnValue('invalid')

      const result = await timeoutService.getTimeoutConfig()

      expect(result).toBe(45) // should fall back to default
    })

    it('should handle startTimeout errors', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockRejectedValue(new Error('Config error'))
      
      const startTime = Date.now()
      
      await expect(timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)).rejects.toThrow('Config error')
    })

    it('should handle calculateRemainingTime errors', async () => {
      vi.spyOn(timeoutService, 'getTimeoutConfig').mockRejectedValue(new Error('Config error'))
      
      const startTime = Date.now()
      
      await expect(timeoutService.calculateRemainingTime(startTime)).rejects.toThrow('Config error')
    })
  })

  describe('Integration Tests', () => {
    it('should handle multiple timeouts with different durations', async () => {
      const mockCallbacks1: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }
      
      const mockCallbacks2: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig')
        .mockResolvedValueOnce(3) // First timeout: 3 seconds
        .mockResolvedValueOnce(5) // Second timeout: 5 seconds
      
      const startTime = Date.now()
      
      await timeoutService.startTimeout('timeout-1', startTime, mockCallbacks1)
      await timeoutService.startTimeout('timeout-2', startTime, mockCallbacks2)
      
      // Advance 3 seconds - first timeout should complete
      vi.advanceTimersByTime(3000)
      expect(mockCallbacks1.onTimeout).toHaveBeenCalled()
      expect(mockCallbacks2.onTimeout).not.toHaveBeenCalled()
      
      // Advance 2 more seconds - second timeout should complete
      vi.advanceTimersByTime(2000)
      expect(mockCallbacks2.onTimeout).toHaveBeenCalled()
    })

    it('should handle timeout cancellation during countdown', async () => {
      const mockCallbacks: TimeoutCallback = {
        onTimeout: vi.fn(),
        onTick: vi.fn()
      }

      vi.spyOn(timeoutService, 'getTimeoutConfig').mockResolvedValue(5)
      
      const startTime = Date.now()
      await timeoutService.startTimeout('test-timeout', startTime, mockCallbacks)
      
      // Advance 2 seconds
      vi.advanceTimersByTime(2000)
      expect(mockCallbacks.onTick).toHaveBeenCalledWith(3)
      
      // Cancel timeout
      timeoutService.clearTimeout('test-timeout')
      
      // Advance remaining time - should not trigger timeout
      vi.advanceTimersByTime(3000)
      expect(mockCallbacks.onTimeout).not.toHaveBeenCalled()
    })
  })
}) 