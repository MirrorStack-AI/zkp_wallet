import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import StorageService, { 
  type StorageConfig, 
  type StorageData, 
  type StorageOptions 
} from '../StorageService'

describe('StorageService', () => {
  let storageService: StorageService
  let mockChrome: any
  let mockBrowser: any

  beforeEach(() => {
    // Reset the singleton instance
    ;(StorageService as any).instance = undefined
    
    // Create fresh instance
    storageService = StorageService.getInstance()
    
    // Mock Chrome APIs
    mockChrome = {
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn()
        }
      }
    }
    
    // Mock Firefox APIs
    mockBrowser = {
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn()
        }
      }
    }
    
    ;(window as any).chrome = mockChrome
    ;(window as any).browser = mockBrowser
    
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
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = StorageService.getInstance()
      const instance2 = StorageService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('setData', () => {
    it('should store data in extension storage when available', async () => {
      const testData = { test: 'value' }
      mockChrome.storage.local.set.mockResolvedValue(undefined)

      await storageService.setData('test-key', testData)

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        'zkp_wallet_test-key': expect.objectContaining({
          value: testData,
          timestamp: expect.any(Number)
        })
      })
    })

    it('should store data in localStorage when extension storage is not available', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      
      const testData = { test: 'value' }
      ;(window.localStorage.setItem as any).mockImplementation(() => {})

      await storageService.setData('test-key', testData)

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'zkp_wallet_test-key',
        expect.stringContaining('"value":{"test":"value"}')
      )
    })

    it('should handle storage options correctly', async () => {
      const testData = { test: 'value' }
      const options: StorageOptions = {
        ttl: 60000, // 1 minute
        encrypt: true,
        compress: true
      }
      
      mockChrome.storage.local.set.mockResolvedValue(undefined)

      await storageService.setData('test-key', testData, options)

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        'zkp_wallet_test-key': expect.objectContaining({
          value: testData,
          timestamp: expect.any(Number),
          expiresAt: expect.any(Number)
        })
      })
    })

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.set.mockRejectedValue(new Error('Storage error'))

      await expect(storageService.setData('test-key', 'test-value')).rejects.toThrow('Storage error')
    })
  })

  describe('getData', () => {
    it('should retrieve data from extension storage when available', async () => {
      const mockStorageData = {
        value: { test: 'value' },
        timestamp: Date.now()
      }
      
      mockChrome.storage.local.get.mockResolvedValue({
        'zkp_wallet_test-key': mockStorageData
      })

      const result = await storageService.getData('test-key')

      expect(result).toEqual({ test: 'value' })
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['zkp_wallet_test-key'])
    })

    it('should retrieve data from localStorage when extension storage is not available', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      
      const mockStorageData = {
        value: { test: 'value' },
        timestamp: Date.now()
      }
      
      ;(window.localStorage.getItem as any).mockReturnValue(JSON.stringify(mockStorageData))

      const result = await storageService.getData('test-key')

      expect(result).toEqual({ test: 'value' })
      expect(window.localStorage.getItem).toHaveBeenCalledWith('zkp_wallet_test-key')
    })

    it('should return null for non-existent data', async () => {
      mockChrome.storage.local.get.mockResolvedValue({})

      const result = await storageService.getData('non-existent')

      expect(result).toBeNull()
    })

    it('should return null for expired data', async () => {
      const mockStorageData = {
        value: { test: 'value' },
        timestamp: Date.now(),
        expiresAt: Date.now() - 1000 // expired 1 second ago
      }
      
      mockChrome.storage.local.get.mockResolvedValue({
        'zkp_wallet_test-key': mockStorageData
      })

      const result = await storageService.getData('test-key')

      expect(result).toBeNull()
    })

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'))

      const result = await storageService.getData('test-key')

      expect(result).toBeNull()
    })
  })

  describe('removeData', () => {
    it('should remove data from extension storage when available', async () => {
      mockChrome.storage.local.remove.mockResolvedValue(undefined)

      await storageService.removeData('test-key')

      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(['zkp_wallet_test-key'])
    })

    it('should remove data from localStorage when extension storage is not available', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      
      ;(window.localStorage.removeItem as any).mockImplementation(() => {})

      await storageService.removeData('test-key')

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('zkp_wallet_test-key')
    })

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.remove.mockRejectedValue(new Error('Storage error'))

      await expect(storageService.removeData('test-key')).rejects.toThrow('Storage error')
    })
  })

  describe('clearAllData', () => {
    it('should clear all data from extension storage when available', async () => {
      mockChrome.storage.local.clear.mockResolvedValue(undefined)

      await storageService.clearAllData()

      expect(mockChrome.storage.local.clear).toHaveBeenCalled()
    })

    it('should clear all data from localStorage when extension storage is not available', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      
      // Mock localStorage keys
      const mockKeys = ['zkp_wallet_key1', 'zkp_wallet_key2', 'other_key']
      ;(window.localStorage.key as any)
        .mockReturnValueOnce('zkp_wallet_key1')
        .mockReturnValueOnce('zkp_wallet_key2')
        .mockReturnValueOnce('other_key')
        .mockReturnValueOnce(null)
      
      ;(window.localStorage.length as any) = 3
      ;(window.localStorage.removeItem as any).mockImplementation(() => {})

      await storageService.clearAllData()

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('zkp_wallet_key1')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('zkp_wallet_key2')
      expect(window.localStorage.removeItem).not.toHaveBeenCalledWith('other_key')
    })

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.clear.mockRejectedValue(new Error('Storage error'))

      await expect(storageService.clearAllData()).rejects.toThrow('Storage error')
    })
  })

  describe('getMultipleData', () => {
    it('should retrieve multiple data items from extension storage', async () => {
      const mockStorageData = {
        'zkp_wallet_key1': { value: { test1: 'value1' }, timestamp: Date.now() },
        'zkp_wallet_key2': { value: { test2: 'value2' }, timestamp: Date.now() }
      }
      
      mockChrome.storage.local.get.mockResolvedValue(mockStorageData)

      const result = await storageService.getMultipleData(['key1', 'key2'])

      expect(result).toEqual({
        key1: { test1: 'value1' },
        key2: { test2: 'value2' }
      })
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['zkp_wallet_key1', 'zkp_wallet_key2'])
    })

    it('should retrieve multiple data items from localStorage', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      
      const mockStorageData1 = { value: { test1: 'value1' }, timestamp: Date.now() }
      const mockStorageData2 = { value: { test2: 'value2' }, timestamp: Date.now() }
      
      ;(window.localStorage.getItem as any)
        .mockReturnValueOnce(JSON.stringify(mockStorageData1))
        .mockReturnValueOnce(JSON.stringify(mockStorageData2))

      const result = await storageService.getMultipleData(['key1', 'key2'])

      expect(result).toEqual({
        key1: { test1: 'value1' },
        key2: { test2: 'value2' }
      })
    })

    it('should handle missing data items gracefully', async () => {
      const mockStorageData = {
        'zkp_wallet_key1': { value: { test1: 'value1' }, timestamp: Date.now() }
        // key2 is missing
      }
      
      mockChrome.storage.local.get.mockResolvedValue(mockStorageData)

      const result = await storageService.getMultipleData(['key1', 'key2'])

      expect(result).toEqual({
        key1: { test1: 'value1' }
        // key2 is not included
      })
    })

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'))

      const result = await storageService.getMultipleData(['key1', 'key2'])

      expect(result).toEqual({})
    })
  })

  describe('hasData', () => {
    it('should return true when data exists', async () => {
      const mockStorageData = {
        value: { test: 'value' },
        timestamp: Date.now()
      }
      
      mockChrome.storage.local.get.mockResolvedValue({
        'zkp_wallet_test-key': mockStorageData
      })

      const result = await storageService.hasData('test-key')

      expect(result).toBe(true)
    })

    it('should return false when data does not exist', async () => {
      mockChrome.storage.local.get.mockResolvedValue({})

      const result = await storageService.hasData('test-key')

      expect(result).toBe(false)
    })

    it('should return false when data has expired', async () => {
      const mockStorageData = {
        value: { test: 'value' },
        timestamp: Date.now(),
        expiresAt: Date.now() - 1000 // expired
      }
      
      mockChrome.storage.local.get.mockResolvedValue({
        'zkp_wallet_test-key': mockStorageData
      })

      const result = await storageService.hasData('test-key')

      expect(result).toBe(false)
    })
  })

  describe('getAllKeys', () => {
    it('should return all keys from localStorage when extension storage is not available', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      
      const mockKeys = ['zkp_wallet_key1', 'zkp_wallet_key2', 'other_key']
      ;(window.localStorage.key as any)
        .mockReturnValueOnce('zkp_wallet_key1')
        .mockReturnValueOnce('zkp_wallet_key2')
        .mockReturnValueOnce('other_key')
        .mockReturnValueOnce(null)
      
      ;(window.localStorage.length as any) = 3

      const result = await storageService.getAllKeys()

      expect(result).toEqual(['zkp_wallet_key1', 'zkp_wallet_key2'])
    })

    it('should return empty array when extension storage is available', async () => {
      const result = await storageService.getAllKeys()

      expect(result).toEqual([])
    })
  })

  describe('getStorageStats', () => {
    it('should return storage statistics for localStorage', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      
      const mockKeys = ['zkp_wallet_key1', 'zkp_wallet_key2']
      ;(window.localStorage.key as any)
        .mockReturnValueOnce('zkp_wallet_key1')
        .mockReturnValueOnce('zkp_wallet_key2')
        .mockReturnValueOnce(null)
      
      ;(window.localStorage.length as any) = 2
      ;(window.localStorage.getItem as any).mockReturnValue(JSON.stringify({
        value: { test: 'value' },
        timestamp: Date.now()
      }))

      const result = await storageService.getStorageStats()

      expect(result).toEqual({
        totalKeys: 2,
        totalSize: expect.any(Number),
        storageType: 'localStorage'
      })
    })

    it('should return storage statistics for extension storage', async () => {
      const result = await storageService.getStorageStats()

      expect(result).toEqual({
        totalKeys: 0,
        totalSize: 0,
        storageType: 'extension'
      })
    })

    it('should handle errors gracefully', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      ;(window.localStorage.key as any).mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = await storageService.getStorageStats()

      expect(result).toEqual({
        totalKeys: 0,
        totalSize: 0,
        storageType: 'localStorage'
      })
    })
  })

  describe('Browser Compatibility', () => {
    it('should work with Chrome extension APIs', async () => {
      const testData = { test: 'value' }
      mockChrome.storage.local.set.mockResolvedValue(undefined)
      mockChrome.storage.local.get.mockResolvedValue({
        'zkp_wallet_test-key': { value: testData, timestamp: Date.now() }
      })

      await storageService.setData('test-key', testData)
      const result = await storageService.getData('test-key')

      expect(result).toEqual(testData)
    })

    it('should work with Firefox extension APIs', async () => {
      ;(window as any).chrome = undefined
      
      const testData = { test: 'value' }
      mockBrowser.storage.local.set.mockResolvedValue(undefined)
      mockBrowser.storage.local.get.mockResolvedValue({
        'zkp_wallet_test-key': { value: testData, timestamp: Date.now() }
      })

      await storageService.setData('test-key', testData)
      const result = await storageService.getData('test-key')

      expect(result).toEqual(testData)
    })

    it('should fallback to localStorage when no extension APIs are available', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      
      const testData = { test: 'value' }
      ;(window.localStorage.setItem as any).mockImplementation(() => {})
      ;(window.localStorage.getItem as any).mockReturnValue(JSON.stringify({
        value: testData,
        timestamp: Date.now()
      }))

      await storageService.setData('test-key', testData)
      const result = await storageService.getData('test-key')

      expect(result).toEqual(testData)
    })
  })

  describe('Data Processing', () => {
    it('should handle complex data structures', async () => {
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        },
        date: new Date(),
        nullValue: null,
        undefinedValue: undefined
      }
      
      mockChrome.storage.local.set.mockResolvedValue(undefined)
      mockChrome.storage.local.get.mockResolvedValue({
        'zkp_wallet_test-key': { value: complexData, timestamp: Date.now() }
      })

      await storageService.setData('test-key', complexData)
      const result = await storageService.getData('test-key')

      expect(result).toEqual(complexData)
    })

    it('should handle TTL expiration correctly', async () => {
      const testData = { test: 'value' }
      const options: StorageOptions = { ttl: 1000 } // 1 second
      
      mockChrome.storage.local.set.mockResolvedValue(undefined)
      mockChrome.storage.local.get.mockResolvedValue({
        'zkp_wallet_test-key': { 
          value: testData, 
          timestamp: Date.now(),
          expiresAt: Date.now() + 1000
        }
      })

      await storageService.setData('test-key', testData, options)
      const result = await storageService.getData('test-key')

      expect(result).toEqual(testData)
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      ;(window.localStorage.setItem as any).mockImplementation(() => {
        throw new Error('localStorage error')
      })

      await expect(storageService.setData('test-key', 'test-value')).rejects.toThrow('localStorage error')
    })

    it('should handle JSON parsing errors gracefully', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      ;(window.localStorage.getItem as any).mockReturnValue('invalid json')

      const result = await storageService.getData('test-key')

      expect(result).toBeNull()
    })

    it('should handle missing localStorage gracefully', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      ;(window as any).localStorage = undefined

      const result = await storageService.getData('test-key')

      expect(result).toBeNull()
    })
  })
}) 