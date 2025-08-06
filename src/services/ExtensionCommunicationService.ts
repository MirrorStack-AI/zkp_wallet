/**
 * Extension Communication Service
 * Handles communication between the extension and web pages, background scripts,
 * and other extension components across different browser environments
 */

export interface ExtensionMessage {
  type: string
  data?: Record<string, unknown>
  requestId?: string
  status?: string
}

export interface ExtensionResponse {
  success: boolean
  data?: Record<string, unknown>
  error?: string
  status?: string
}

export interface StorageData {
  [key: string]: unknown
}

export interface ExtensionConfig {
  extensionId?: string
  storageKey: string
  timeoutMs: number
  retryAttempts: number
}

export enum BrowserType {
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  EDGE = 'edge',
  SAFARI = 'safari',
  UNKNOWN = 'unknown'
}

export class ExtensionCommunicationService {
  private static instance: ExtensionCommunicationService
  private readonly config: ExtensionConfig
  private browserType: BrowserType

  private constructor() {
    this.config = {
      storageKey: 'extensionData',
      timeoutMs: 5000,
      retryAttempts: 3
    }
    this.browserType = this.detectBrowserType()
  }

  public static getInstance(): ExtensionCommunicationService {
    if (!ExtensionCommunicationService.instance) {
      ExtensionCommunicationService.instance = new ExtensionCommunicationService()
    }
    return ExtensionCommunicationService.instance
  }

  /**
   * Detect the current browser type
   */
  private detectBrowserType(): BrowserType {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return BrowserType.CHROME
    } else if (userAgent.includes('firefox')) {
      return BrowserType.FIREFOX
    } else if (userAgent.includes('edg')) {
      return BrowserType.EDGE
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return BrowserType.SAFARI
    }
    
    return BrowserType.UNKNOWN
  }

  /**
   * Get the current browser type
   */
  public getBrowserType(): BrowserType {
    return this.browserType
  }

  /**
   * Check if extension APIs are available
   */
  public isExtensionAvailable(): boolean {
    switch (this.browserType) {
      case BrowserType.CHROME:
      case BrowserType.EDGE:
        return !!(window as any).chrome?.runtime?.sendMessage
      case BrowserType.FIREFOX:
        return !!(window as any).browser?.runtime?.sendMessage
      default:
        return false
    }
  }

  /**
   * Check if storage APIs are available
   */
  public isStorageAvailable(): boolean {
    switch (this.browserType) {
      case BrowserType.CHROME:
      case BrowserType.EDGE:
        return !!(window as any).chrome?.storage?.local
      case BrowserType.FIREFOX:
        return !!(window as any).browser?.storage?.local
      default:
        return false
    }
  }

  /**
   * Send message to background script
   */
  public async sendMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
    try {
      if (!this.isExtensionAvailable()) {
        throw new Error('Extension APIs not available')
      }

      let response: ExtensionResponse

      switch (this.browserType) {
        case BrowserType.CHROME:
        case BrowserType.EDGE:
          response = await (window as any).chrome.runtime.sendMessage(message)
          break
        case BrowserType.FIREFOX:
          response = await (window as any).browser.runtime.sendMessage(message)
          break
        default:
          throw new Error('Unsupported browser type')
      }

      return response || { success: false, error: 'No response received' }
    } catch (error) {
      console.error('ExtensionCommunicationService: Failed to send message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send message with retry logic
   */
  public async sendMessageWithRetry(
    message: ExtensionMessage,
    retryAttempts: number = this.config.retryAttempts
  ): Promise<ExtensionResponse> {
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const response = await this.sendMessage(message)
        if (response.success) {
          return response
        }
        
        if (attempt === retryAttempts) {
          return response
        }
        
        // Wait before retry
        await this.delay(1000 * attempt)
      } catch (error) {
        if (attempt === retryAttempts) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
        
        await this.delay(1000 * attempt)
      }
    }
    
    return {
      success: false,
      error: 'Max retry attempts exceeded'
    }
  }

  /**
   * Store data in extension storage
   */
  public async storeData(key: string, data: unknown): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        throw new Error('Storage APIs not available')
      }

      const storageData: StorageData = { [key]: data }

      switch (this.browserType) {
        case BrowserType.CHROME:
        case BrowserType.EDGE:
          await (window as any).chrome.storage.local.set(storageData)
          break
        case BrowserType.FIREFOX:
          await (window as any).browser.storage.local.set(storageData)
          break
        default:
          throw new Error('Unsupported browser type')
      }

      console.log('ExtensionCommunicationService: Data stored successfully:', key)
    } catch (error) {
      console.error('ExtensionCommunicationService: Failed to store data:', error)
      throw error
    }
  }

  /**
   * Get data from extension storage
   */
  public async getData(key: string): Promise<unknown> {
    try {
      if (!this.isStorageAvailable()) {
        return null
      }

      let result: StorageData

      switch (this.browserType) {
        case BrowserType.CHROME:
        case BrowserType.EDGE:
          result = await (window as any).chrome.storage.local.get([key])
          break
        case BrowserType.FIREFOX:
          result = await (window as any).browser.storage.local.get([key])
          break
        default:
          return null
      }

      return result[key] || null
    } catch (error) {
      console.error('ExtensionCommunicationService: Failed to get data:', error)
      return null
    }
  }

  /**
   * Get multiple data items from extension storage
   */
  public async getMultipleData(keys: string[]): Promise<StorageData> {
    try {
      if (!this.isStorageAvailable()) {
        return {}
      }

      let result: StorageData

      switch (this.browserType) {
        case BrowserType.CHROME:
        case BrowserType.EDGE:
          result = await (window as any).chrome.storage.local.get(keys)
          break
        case BrowserType.FIREFOX:
          result = await (window as any).browser.storage.local.get(keys)
          break
        default:
          return {}
      }

      return result
    } catch (error) {
      console.error('ExtensionCommunicationService: Failed to get multiple data:', error)
      return {}
    }
  }

  /**
   * Remove data from extension storage
   */
  public async removeData(key: string): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        return
      }

      switch (this.browserType) {
        case BrowserType.CHROME:
        case BrowserType.EDGE:
          await (window as any).chrome.storage.local.remove([key])
          break
        case BrowserType.FIREFOX:
          await (window as any).browser.storage.local.remove([key])
          break
        default:
          return
      }

      console.log('ExtensionCommunicationService: Data removed successfully:', key)
    } catch (error) {
      console.error('ExtensionCommunicationService: Failed to remove data:', error)
      throw error
    }
  }

  /**
   * Clear all extension storage
   */
  public async clearStorage(): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        return
      }

      switch (this.browserType) {
        case BrowserType.CHROME:
        case BrowserType.EDGE:
          await (window as any).chrome.storage.local.clear()
          break
        case BrowserType.FIREFOX:
          await (window as any).browser.storage.local.clear()
          break
        default:
          return
      }

      console.log('ExtensionCommunicationService: Storage cleared successfully')
    } catch (error) {
      console.error('ExtensionCommunicationService: Failed to clear storage:', error)
      throw error
    }
  }

  /**
   * Add message listener
   */
  public addMessageListener(
    callback: (message: ExtensionMessage, sender: any, sendResponse: (response: ExtensionResponse) => void) => void
  ): void {
    if (!this.isExtensionAvailable()) {
      console.warn('ExtensionCommunicationService: Extension APIs not available for message listener')
      return
    }

    switch (this.browserType) {
      case BrowserType.CHROME:
      case BrowserType.EDGE:
        (window as any).chrome.runtime.onMessage.addListener(callback)
        break
      case BrowserType.FIREFOX:
        (window as any).browser.runtime.onMessage.addListener(callback)
        break
      default:
        console.warn('ExtensionCommunicationService: Unsupported browser type for message listener')
    }
  }

  /**
   * Remove message listener
   */
  public removeMessageListener(
    callback: (message: ExtensionMessage, sender: any, sendResponse: (response: ExtensionResponse) => void) => void
  ): void {
    if (!this.isExtensionAvailable()) {
      return
    }

    switch (this.browserType) {
      case BrowserType.CHROME:
      case BrowserType.EDGE:
        (window as any).chrome.runtime.onMessage.removeListener(callback)
        break
      case BrowserType.FIREFOX:
        (window as any).browser.runtime.onMessage.removeListener(callback)
        break
      default:
        console.warn('ExtensionCommunicationService: Unsupported browser type for message listener removal')
    }
  }

  /**
   * Get extension URL for a given path
   */
  public getExtensionURL(path: string): string {
    if (!this.isExtensionAvailable()) {
      throw new Error('Extension APIs not available')
    }

    switch (this.browserType) {
      case BrowserType.CHROME:
      case BrowserType.EDGE:
        return (window as any).chrome.runtime.getURL(path)
      case BrowserType.FIREFOX:
        return (window as any).browser.runtime.getURL(path)
      default:
        throw new Error('Unsupported browser type')
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get extension information
   */
  public getExtensionInfo(): { browserType: BrowserType; isAvailable: boolean; isStorageAvailable: boolean } {
    return {
      browserType: this.browserType,
      isAvailable: this.isExtensionAvailable(),
      isStorageAvailable: this.isStorageAvailable()
    }
  }
}

export default ExtensionCommunicationService 