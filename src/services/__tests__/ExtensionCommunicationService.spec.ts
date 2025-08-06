import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import ExtensionCommunicationService, { 
  type ExtensionMessage, 
  type ExtensionResponse,
  type StorageData,
  type ExtensionConfig,
  BrowserType
} from '../ExtensionCommunicationService'

describe('ExtensionCommunicationService', () => {
  let extensionService: ExtensionCommunicationService
  let mockChrome: any
  let mockBrowser: any

  beforeEach(() => {
    // Reset the singleton instance
    ;(ExtensionCommunicationService as any).instance = undefined
    
    // Create fresh instance
    extensionService = ExtensionCommunicationService.getInstance()
    
    // Mock Chrome APIs
    mockChrome = {
      runtime: {
        sendMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        },
        getURL: vi.fn()
      },
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
      runtime: {
        sendMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        },
        getURL: vi.fn()
      },
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
    
    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      writable: true
    })
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ExtensionCommunicationService.getInstance()
      const instance2 = ExtensionCommunicationService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Browser Detection', () => {
    it('should detect Chrome browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true
      })
      
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      const service = ExtensionCommunicationService.getInstance()
      
      expect(service.getBrowserType()).toBe(BrowserType.CHROME)
    })

    it('should detect Firefox browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        writable: true
      })
      
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      const service = ExtensionCommunicationService.getInstance()
      
      expect(service.getBrowserType()).toBe(BrowserType.FIREFOX)
    })

    it('should detect Edge browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        writable: true
      })
      
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      const service = ExtensionCommunicationService.getInstance()
      
      expect(service.getBrowserType()).toBe(BrowserType.EDGE)
    })

    it('should detect Safari browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        writable: true
      })
      
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      const service = ExtensionCommunicationService.getInstance()
      
      expect(service.getBrowserType()).toBe(BrowserType.SAFARI)
    })

    it('should detect unknown browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Unknown Browser',
        writable: true
      })
      
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      const service = ExtensionCommunicationService.getInstance()
      
      expect(service.getBrowserType()).toBe(BrowserType.UNKNOWN)
    })
  })

  describe('Extension Availability', () => {
    it('should detect Chrome extension availability', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      // Ensure Chrome is properly mocked
      ;(window as any).chrome = mockChrome
      const extensionService = ExtensionCommunicationService.getInstance()
      expect(extensionService.isExtensionAvailable()).toBe(true)
    })

    it('should detect Firefox extension availability', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = mockBrowser
      // Mock user agent for Firefox
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
        writable: true
      })
      const extensionService = ExtensionCommunicationService.getInstance()
      expect(extensionService.isExtensionAvailable()).toBe(true)
    })

    it('should detect when extension is not available', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      const extensionService = ExtensionCommunicationService.getInstance()
      expect(extensionService.isExtensionAvailable()).toBe(false)
    })

    it('should detect storage availability for Chrome', () => {
      expect(extensionService.isStorageAvailable()).toBe(true)
    })

    it('should detect storage availability for Firefox', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = mockBrowser
      // Mock user agent for Firefox
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
        writable: true
      })
      const firefoxService = ExtensionCommunicationService.getInstance()
      expect(firefoxService.isStorageAvailable()).toBe(true)
    })

    it('should detect when storage is not available', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      const extensionService = ExtensionCommunicationService.getInstance()
      expect(extensionService.isStorageAvailable()).toBe(false)
    })
  })

  describe('sendMessage', () => {
    it('should send message via Chrome runtime', async () => {
      const message: ExtensionMessage = {
        type: 'TEST_MESSAGE',
        data: { test: 'value' }
      }
      
      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: { response: 'test' }
      })

      const response = await extensionService.sendMessage(message)

      expect(response).toEqual({
        success: true,
        data: { response: 'test' }
      })
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(message)
    })

    it('should send message via Firefox runtime', async () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = mockBrowser
      // Mock user agent for Firefox
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
        writable: true
      })
      
      const message: ExtensionMessage = {
        type: 'TEST_MESSAGE',
        data: { test: 'value' }
      }
      
      mockBrowser.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: { response: 'test' }
      })

      const firefoxService = ExtensionCommunicationService.getInstance()
      const response = await firefoxService.sendMessage(message)

      expect(response).toEqual({
        success: true,
        data: { response: 'test' }
      })
      expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(message)
    })

    it('should handle null response', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue(null)

      const response = await extensionService.sendMessage({
        type: 'TEST_MESSAGE'
      })

      expect(response).toEqual({
        success: false,
        error: 'No response received'
      })
    })

    it('should handle extension unavailability', async () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined

      const response = await extensionService.sendMessage({
        type: 'TEST_MESSAGE'
      })

      expect(response).toEqual({
        success: false,
        error: 'Extension APIs not available'
      })
    })

    it('should handle runtime errors', async () => {
      mockChrome.runtime.sendMessage.mockRejectedValue(new Error('Runtime error'))

      const response = await extensionService.sendMessage({
        type: 'TEST_MESSAGE'
      })

      expect(response).toEqual({
        success: false,
        error: 'Runtime error'
      })
    })

    it('should handle unsupported browser type', async () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      // Mock browser type to UNKNOWN by setting browserType directly
      const unsupportedService = ExtensionCommunicationService.getInstance()
      ;(unsupportedService as any).browserType = BrowserType.UNKNOWN
      
      const message: ExtensionMessage = {
        type: 'TEST_MESSAGE',
        data: { test: 'value' }
      }
      
      const response = await unsupportedService.sendMessage(message)

      expect(response).toEqual({
        success: false,
        error: 'Extension APIs not available'
      })
    })
  })

  describe('sendMessageWithRetry', () => {
    it('should send message successfully on first attempt', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: { response: 'test' }
      })

      const response = await extensionService.sendMessageWithRetry({
        type: 'TEST_MESSAGE'
      })

      expect(response.success).toBe(true)
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and succeed', async () => {
      mockChrome.runtime.sendMessage
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({
          success: true,
          data: { response: 'test' }
        })

      const response = await extensionService.sendMessageWithRetry({
        type: 'TEST_MESSAGE'
      }, 2)

      expect(response.success).toBe(true)
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retry attempts', async () => {
      mockChrome.runtime.sendMessage.mockRejectedValue(new Error('Persistent error'))

      const response = await extensionService.sendMessageWithRetry({
        type: 'TEST_MESSAGE'
      }, 3)

      expect(response.success).toBe(false)
      expect(response.error).toBe('Persistent error')
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledTimes(3)
    })

    it('should handle successful response after failed attempts', async () => {
      mockChrome.runtime.sendMessage
        .mockResolvedValueOnce({ success: false, error: 'First attempt' })
        .mockResolvedValueOnce({ success: true, data: { response: 'test' } })

      const response = await extensionService.sendMessageWithRetry({
        type: 'TEST_MESSAGE'
      }, 2)

      expect(response.success).toBe(true)
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledTimes(2)
    })
  })

  describe('Storage Operations', () => {
    describe('storeData', () => {
      it('should store data via Chrome storage', async () => {
        const testData = { test: 'value' }
        mockChrome.storage.local.set.mockResolvedValue(undefined)

        await extensionService.storeData('test-key', testData)

        expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
          'test-key': testData
        })
      })

      it('should store data via Firefox storage', async () => {
        // Reset instance to trigger browser detection
        ;(ExtensionCommunicationService as any).instance = undefined
        ;(window as any).chrome = undefined
        ;(window as any).browser = mockBrowser
        // Mock user agent for Firefox
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
          writable: true
        })
        
        const testData = { test: 'value' }
        mockBrowser.storage.local.set.mockResolvedValue(undefined)

        const firefoxService = ExtensionCommunicationService.getInstance()
        await firefoxService.storeData('test-key', testData)

        expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({
          'test-key': testData
        })
      })

      it('should handle storage unavailability', async () => {
        ;(window as any).chrome = undefined
        ;(window as any).browser = undefined

        await expect(extensionService.storeData('test-key', 'test-value')).rejects.toThrow('Storage APIs not available')
      })
    })

    describe('getData', () => {
      it('should get data via Chrome storage', async () => {
        const testData = { test: 'value' }
        mockChrome.storage.local.get.mockResolvedValue({
          'test-key': testData
        })

        const result = await extensionService.getData('test-key')

        expect(result).toEqual(testData)
        expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['test-key'])
      })

      it('should get data via Firefox storage', async () => {
        // Reset instance to trigger browser detection
        ;(ExtensionCommunicationService as any).instance = undefined
        ;(window as any).chrome = undefined
        ;(window as any).browser = mockBrowser
        // Mock user agent for Firefox
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
          writable: true
        })
        
        const testData = { test: 'value' }
        mockBrowser.storage.local.get.mockResolvedValue({
          'test-key': testData
        })

        const firefoxService = ExtensionCommunicationService.getInstance()
        const result = await firefoxService.getData('test-key')

        expect(result).toEqual(testData)
        expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(['test-key'])
      })

      it('should return null when data not found', async () => {
        mockChrome.storage.local.get.mockResolvedValue({})

        const result = await extensionService.getData('test-key')

        expect(result).toBeNull()
      })

      it('should return null when storage unavailable', async () => {
        ;(window as any).chrome = undefined
        ;(window as any).browser = undefined

        const result = await extensionService.getData('test-key')

        expect(result).toBeNull()
      })
    })

    describe('getMultipleData', () => {
      it('should get multiple data items via Chrome storage', async () => {
        const testData = {
          'key1': { test1: 'value1' },
          'key2': { test2: 'value2' }
        }
        mockChrome.storage.local.get.mockResolvedValue(testData)

        const result = await extensionService.getMultipleData(['key1', 'key2'])

        expect(result).toEqual(testData)
        expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['key1', 'key2'])
      })

      it('should get multiple data items via Firefox storage', async () => {
        // Reset instance to trigger browser detection
        ;(ExtensionCommunicationService as any).instance = undefined
        ;(window as any).chrome = undefined
        ;(window as any).browser = mockBrowser
        // Mock user agent for Firefox
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
          writable: true
        })
        
        const testData = {
          'key1': { test1: 'value1' },
          'key2': { test2: 'value2' }
        }
        mockBrowser.storage.local.get.mockResolvedValue(testData)

        const firefoxService = ExtensionCommunicationService.getInstance()
        const result = await firefoxService.getMultipleData(['key1', 'key2'])

        expect(result).toEqual(testData)
        expect(mockBrowser.storage.local.get).toHaveBeenCalledWith(['key1', 'key2'])
      })

      it('should return empty object when storage unavailable', async () => {
        ;(window as any).chrome = undefined
        ;(window as any).browser = undefined

        const result = await extensionService.getMultipleData(['key1', 'key2'])

        expect(result).toEqual({})
      })
    })

    describe('removeData', () => {
      it('should remove data via Chrome storage', async () => {
        mockChrome.storage.local.remove.mockResolvedValue(undefined)

        await extensionService.removeData('test-key')

        expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(['test-key'])
      })

      it('should remove data via Firefox storage', async () => {
        // Reset instance to trigger browser detection
        ;(ExtensionCommunicationService as any).instance = undefined
        ;(window as any).chrome = undefined
        ;(window as any).browser = mockBrowser
        // Mock user agent for Firefox
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
          writable: true
        })
        mockBrowser.storage.local.remove.mockResolvedValue(undefined)

        const firefoxService = ExtensionCommunicationService.getInstance()
        await firefoxService.removeData('test-key')

        expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith(['test-key'])
      })

      it('should handle storage unavailability gracefully', async () => {
        ;(window as any).chrome = undefined
        ;(window as any).browser = undefined

        await extensionService.removeData('test-key')
        // Should not throw
      })
    })

    describe('clearStorage', () => {
      it('should clear storage via Chrome', async () => {
        mockChrome.storage.local.clear.mockResolvedValue(undefined)

        await extensionService.clearStorage()

        expect(mockChrome.storage.local.clear).toHaveBeenCalled()
      })

      it('should clear storage via Firefox', async () => {
        // Reset instance to trigger browser detection
        ;(ExtensionCommunicationService as any).instance = undefined
        ;(window as any).chrome = undefined
        ;(window as any).browser = mockBrowser
        // Mock user agent for Firefox
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
          writable: true
        })
        mockBrowser.storage.local.clear.mockResolvedValue(undefined)

        const firefoxService = ExtensionCommunicationService.getInstance()
        await firefoxService.clearStorage()

        expect(mockBrowser.storage.local.clear).toHaveBeenCalled()
      })

      it('should handle storage unavailability gracefully', async () => {
        ;(window as any).chrome = undefined
        ;(window as any).browser = undefined

        await extensionService.clearStorage()
        // Should not throw
      })
    })
  })

  describe('Message Listeners', () => {
    it('should add message listener for Chrome', () => {
      const callback = vi.fn()
      
      extensionService.addMessageListener(callback)

      expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalledWith(callback)
    })

    it('should add message listener for Firefox', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = mockBrowser
      // Mock user agent for Firefox
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
        writable: true
      })
      
      const callback = vi.fn()
      
      const firefoxService = ExtensionCommunicationService.getInstance()
      firefoxService.addMessageListener(callback)

      expect(mockBrowser.runtime.onMessage.addListener).toHaveBeenCalledWith(callback)
    })

    it('should remove message listener for Chrome', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      // Ensure Chrome is properly mocked and extension is available
      ;(window as any).chrome = mockChrome
      // Mock user agent for Chrome
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true
      })
      
      const chromeService = ExtensionCommunicationService.getInstance()
      const callback = vi.fn()
      
      // First add the listener
      chromeService.addMessageListener(callback)
      // Then remove it
      chromeService.removeMessageListener(callback)

      expect(mockChrome.runtime.onMessage.removeListener).toHaveBeenCalledWith(callback)
    })

    it('should remove message listener for Firefox', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = mockBrowser
      // Mock user agent for Firefox
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
        writable: true
      })
      
      const callback = vi.fn()
      
      const firefoxService = ExtensionCommunicationService.getInstance()
      firefoxService.removeMessageListener(callback)

      expect(mockBrowser.runtime.onMessage.removeListener).toHaveBeenCalledWith(callback)
    })

    it('should handle unsupported browser for message listeners', () => {
      vi.spyOn(extensionService, 'getBrowserType').mockReturnValue(BrowserType.UNKNOWN)
      
      const callback = vi.fn()
      
      extensionService.addMessageListener(callback)
      extensionService.removeMessageListener(callback)
      
      // Should not throw and should log warnings
    })
  })

  describe('getExtensionURL', () => {
    it('should get extension URL via Chrome', () => {
      mockChrome.runtime.getURL.mockReturnValue('chrome-extension://test/path')

      const url = extensionService.getExtensionURL('path')

      expect(url).toBe('chrome-extension://test/path')
      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('path')
    })

    it('should get extension URL via Firefox', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = mockBrowser
      // Mock user agent for Firefox
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
        writable: true
      })
      mockBrowser.runtime.getURL.mockReturnValue('moz-extension://test/path')

      const firefoxService = ExtensionCommunicationService.getInstance()
      const url = firefoxService.getExtensionURL('path')

      expect(url).toBe('moz-extension://test/path')
      expect(mockBrowser.runtime.getURL).toHaveBeenCalledWith('path')
    })

    it('should throw error when extension APIs not available', () => {
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined

      expect(() => extensionService.getExtensionURL('path')).toThrow('Extension APIs not available')
    })
  })

  describe('getExtensionInfo', () => {
    it('should return extension information', () => {
      const info = extensionService.getExtensionInfo()

      expect(info).toEqual({
        browserType: expect.any(String),
        isAvailable: expect.any(Boolean),
        isStorageAvailable: expect.any(Boolean)
      })
    })

    it('should return correct info for Chrome', () => {
      const info = extensionService.getExtensionInfo()

      expect(info.browserType).toBe(BrowserType.CHROME)
      expect(info.isAvailable).toBe(true)
      expect(info.isStorageAvailable).toBe(true)
    })

    it('should return correct info for Firefox', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = mockBrowser
      // Mock user agent for Firefox
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
        writable: true
      })
      
      const firefoxService = ExtensionCommunicationService.getInstance()
      const info = firefoxService.getExtensionInfo()

      expect(info.browserType).toBe(BrowserType.FIREFOX)
      expect(info.isAvailable).toBe(true)
      expect(info.isStorageAvailable).toBe(true)
    })

    it('should return correct info when extension not available', () => {
      // Reset instance to trigger browser detection
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = undefined
      
      const extensionService = ExtensionCommunicationService.getInstance()
      const info = extensionService.getExtensionInfo()

      expect(info.isAvailable).toBe(false)
      expect(info.isStorageAvailable).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.set.mockRejectedValue(new Error('Storage error'))

      await expect(extensionService.storeData('test-key', 'test-value')).rejects.toThrow('Storage error')
    })

    it('should handle runtime errors gracefully', async () => {
      mockChrome.runtime.sendMessage.mockRejectedValue(new Error('Runtime error'))

      const response = await extensionService.sendMessage({
        type: 'TEST_MESSAGE'
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Runtime error')
    })

    it('should handle unknown error types', async () => {
      mockChrome.runtime.sendMessage.mockRejectedValue('String error')

      const response = await extensionService.sendMessage({
        type: 'TEST_MESSAGE'
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Unknown error')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete message flow', async () => {
      const message: ExtensionMessage = {
        type: 'TEST_MESSAGE',
        data: { test: 'value' }
      }
      
      mockChrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: { response: 'test' }
      })

      const response = await extensionService.sendMessage(message)

      expect(response.success).toBe(true)
      expect(response.data).toEqual({ response: 'test' })
    })

    it('should handle storage operations flow', async () => {
      const testData = { test: 'value' }
      
      mockChrome.storage.local.set.mockResolvedValue(undefined)
      mockChrome.storage.local.get.mockResolvedValue({
        'test-key': testData
      })
      mockChrome.storage.local.remove.mockResolvedValue(undefined)

      await extensionService.storeData('test-key', testData)
      const retrieved = await extensionService.getData('test-key')
      await extensionService.removeData('test-key')

      expect(retrieved).toEqual(testData)
    })

    it('should handle browser switching', async () => {
      // Test Chrome
      expect(extensionService.getBrowserType()).toBe(BrowserType.CHROME)
      expect(extensionService.isExtensionAvailable()).toBe(true)

      // Switch to Firefox
      ;(ExtensionCommunicationService as any).instance = undefined
      ;(window as any).chrome = undefined
      ;(window as any).browser = mockBrowser
      // Mock user agent for Firefox
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
        writable: true
      })
      
      // Reset instance to trigger browser detection
      const firefoxService = ExtensionCommunicationService.getInstance()
      
      expect(firefoxService.getBrowserType()).toBe(BrowserType.FIREFOX)
      expect(firefoxService.isExtensionAvailable()).toBe(true)
    })
  })
}) 