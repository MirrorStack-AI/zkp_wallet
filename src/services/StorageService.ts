/**
 * Storage Service
 * Handles storage operations across different environments and browser types
 */

export interface StorageConfig {
  prefix: string
  defaultTimeoutMs: number
  retryAttempts: number
}

export interface StorageData {
  [key: string]: unknown
}

export interface StorageOptions {
  encrypt?: boolean
  compress?: boolean
  ttl?: number // Time to live in milliseconds
}

export class StorageService {
  private static instance: StorageService
  private readonly config: StorageConfig
  private readonly extensionService: any // Will be imported from ExtensionCommunicationService

  private constructor() {
    this.config = {
      prefix: 'zkp_wallet_',
      defaultTimeoutMs: 5000,
      retryAttempts: 3
    }
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  /**
   * Set data in storage
   */
  public async setData(key: string, data: unknown, options?: StorageOptions): Promise<void> {
    try {
      const fullKey = this.getFullKey(key)
      const storageData = this.prepareDataForStorage(data, options)
      
      // Try extension storage first
      if (this.isExtensionStorageAvailable()) {
        await this.setExtensionData(fullKey, storageData)
        return
      }
      
      // Fallback to localStorage
      this.setLocalStorageData(fullKey, storageData)
    } catch (error) {
      console.error('StorageService: Failed to set data:', error)
      throw error
    }
  }

  /**
   * Get data from storage
   */
  public async getData<T = unknown>(key: string, options?: StorageOptions): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key)
      
      // Try extension storage first
      if (this.isExtensionStorageAvailable()) {
        const data = await this.getExtensionData(fullKey)
        return this.processRetrievedData<T>(data, options)
      }
      
      // Fallback to localStorage
      const data = this.getLocalStorageData(fullKey)
      return this.processRetrievedData<T>(data, options)
    } catch (error) {
      console.error('StorageService: Failed to get data:', error)
      return null
    }
  }

  /**
   * Remove data from storage
   */
  public async removeData(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key)
      
      // Try extension storage first
      if (this.isExtensionStorageAvailable()) {
        await this.removeExtensionData(fullKey)
        return
      }
      
      // Fallback to localStorage
      this.removeLocalStorageData(fullKey)
    } catch (error) {
      console.error('StorageService: Failed to remove data:', error)
      throw error
    }
  }

  /**
   * Clear all data with prefix
   */
  public async clearAllData(): Promise<void> {
    try {
      // Try extension storage first
      if (this.isExtensionStorageAvailable()) {
        await this.clearExtensionData()
        return
      }
      
      // Fallback to localStorage
      this.clearLocalStorageData()
    } catch (error) {
      console.error('StorageService: Failed to clear data:', error)
      throw error
    }
  }

  /**
   * Get multiple data items
   */
  public async getMultipleData<T = unknown>(keys: string[]): Promise<Record<string, T>> {
    try {
      const fullKeys = keys.map(key => this.getFullKey(key))
      
      // Try extension storage first
      if (this.isExtensionStorageAvailable()) {
        const data = await this.getMultipleExtensionData(fullKeys)
        return this.processMultipleRetrievedData<T>(data)
      }
      
      // Fallback to localStorage
      const data = this.getMultipleLocalStorageData(fullKeys)
      return this.processMultipleRetrievedData<T>(data)
    } catch (error) {
      console.error('StorageService: Failed to get multiple data:', error)
      return {}
    }
  }

  /**
   * Check if data exists
   */
  public async hasData(key: string): Promise<boolean> {
    try {
      const data = await this.getData(key)
      return data !== null
    } catch (error) {
      return false
    }
  }

  /**
   * Get all keys with prefix
   */
  public async getAllKeys(): Promise<string[]> {
    try {
      // For localStorage, we can get all keys
      if (!this.isExtensionStorageAvailable()) {
        return this.getLocalStorageKeys()
      }
      
      // For extension storage, we need to know the keys in advance
      // This is a limitation of the extension storage API
      return []
    } catch (error) {
      console.error('StorageService: Failed to get all keys:', error)
      return []
    }
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<{
    totalKeys: number
    totalSize: number
    storageType: 'extension' | 'localStorage'
  }> {
    try {
      const keys = await this.getAllKeys()
      const totalSize = keys.reduce((size, key) => {
        const data = this.getLocalStorageData(key)
        return size + (data ? JSON.stringify(data).length : 0)
      }, 0)

      return {
        totalKeys: keys.length,
        totalSize,
        storageType: this.isExtensionStorageAvailable() ? 'extension' : 'localStorage'
      }
    } catch (error) {
      console.error('StorageService: Failed to get storage stats:', error)
      return {
        totalKeys: 0,
        totalSize: 0,
        storageType: 'localStorage'
      }
    }
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.config.prefix}${key}`
  }

  /**
   * Prepare data for storage
   */
  private prepareDataForStorage(data: unknown, options?: StorageOptions): StorageData {
    const storageData: StorageData = {
      value: data,
      timestamp: Date.now()
    }

    if (options?.ttl) {
      storageData.expiresAt = Date.now() + options.ttl
    }

    return storageData
  }

  /**
   * Process retrieved data
   */
  private processRetrievedData<T>(data: StorageData | null, options?: StorageOptions): T | null {
    if (!data) {
      return null
    }

    // Check if data has expired
    if (data.expiresAt && typeof data.expiresAt === 'number' && Date.now() > data.expiresAt) {
      console.log('StorageService: Data has expired')
      return null
    }

    return data.value as T
  }

  /**
   * Process multiple retrieved data items
   */
  private processMultipleRetrievedData<T>(data: Record<string, StorageData>): Record<string, T> {
    const result: Record<string, T> = {}
    
    for (const [key, storageData] of Object.entries(data)) {
      const processed = this.processRetrievedData<T>(storageData)
      if (processed !== null) {
        const shortKey = key.replace(this.config.prefix, '')
        result[shortKey] = processed
      }
    }
    
    return result
  }

  /**
   * Check if extension storage is available
   */
  private isExtensionStorageAvailable(): boolean {
    return !!(window as any).chrome?.storage?.local || !!(window as any).browser?.storage?.local
  }

  /**
   * Extension storage methods
   */
  private async setExtensionData(key: string, data: StorageData): Promise<void> {
    if ((window as any).chrome?.storage?.local) {
      await (window as any).chrome.storage.local.set({ [key]: data })
    } else if ((window as any).browser?.storage?.local) {
      await (window as any).browser.storage.local.set({ [key]: data })
    }
  }

  private async getExtensionData(key: string): Promise<StorageData | null> {
    let result: Record<string, unknown>
    
    if ((window as any).chrome?.storage?.local) {
      result = await (window as any).chrome.storage.local.get([key])
    } else if ((window as any).browser?.storage?.local) {
      result = await (window as any).browser.storage.local.get([key])
    } else {
      return null
    }
    
    return (result[key] as StorageData) || null
  }

  private async getMultipleExtensionData(keys: string[]): Promise<Record<string, StorageData>> {
    let result: Record<string, StorageData>
    
    if ((window as any).chrome?.storage?.local) {
      result = await (window as any).chrome.storage.local.get(keys)
    } else if ((window as any).browser?.storage?.local) {
      result = await (window as any).browser.storage.local.get(keys)
    } else {
      return {}
    }
    
    return result
  }

  private async removeExtensionData(key: string): Promise<void> {
    if ((window as any).chrome?.storage?.local) {
      await (window as any).chrome.storage.local.remove([key])
    } else if ((window as any).browser?.storage?.local) {
      await (window as any).browser.storage.local.remove([key])
    }
  }

  private async clearExtensionData(): Promise<void> {
    if ((window as any).chrome?.storage?.local) {
      await (window as any).chrome.storage.local.clear()
    } else if ((window as any).browser?.storage?.local) {
      await (window as any).browser.storage.local.clear()
    }
  }

  /**
   * LocalStorage methods
   */
  private setLocalStorageData(key: string, data: StorageData): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('StorageService: Failed to set localStorage data:', error)
      throw error
    }
  }

  private getLocalStorageData(key: string): StorageData | null {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('StorageService: Failed to get localStorage data:', error)
      return null
    }
  }

  private getMultipleLocalStorageData(keys: string[]): Record<string, StorageData> {
    const result: Record<string, StorageData> = {}
    
    for (const key of keys) {
      const data = this.getLocalStorageData(key)
      if (data) {
        result[key] = data
      }
    }
    
    return result
  }

  private removeLocalStorageData(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('StorageService: Failed to remove localStorage data:', error)
      throw error
    }
  }

  private clearLocalStorageData(): void {
    try {
      const keys = this.getLocalStorageKeys()
      for (const key of keys) {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('StorageService: Failed to clear localStorage data:', error)
      throw error
    }
  }

  private getLocalStorageKeys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.config.prefix)) {
        keys.push(key)
      }
    }
    return keys
  }
}

export default StorageService 