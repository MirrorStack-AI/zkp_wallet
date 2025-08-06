/**
 * Authentication Service
 * Handles all authentication-related operations including request management,
 * status updates, timeout handling, and Chrome extension communication
 */

export interface AuthenticationRequest {
  sourceUrl: string
  destinationUrl: string
  requestId: string
  startTime?: number
  status?: 'pending' | 'completed' | 'cancelled' | 'timeout'
}

export interface AuthenticationResponse {
  success: boolean
  requestId?: string
  error?: string
  status?: string
}

export interface AuthenticationStatus {
  status: 'pending' | 'completed' | 'cancelled' | 'timeout'
  requestId: string
  timestamp: number
}

export interface TimeoutConfig {
  defaultTimeoutSeconds: number
  extensionTimeoutSeconds?: number
  localStorageKey: string
}

export class AuthenticationService {
  private static instance: AuthenticationService
  private readonly timeoutConfig: TimeoutConfig
  private readonly storageKey = 'authRequests'
  private readonly timeoutKey = 'extensionTimeoutSeconds'

  private constructor() {
    this.timeoutConfig = {
      defaultTimeoutSeconds: 45,
      localStorageKey: 'openExtensionTimeoutSeconds'
    }
  }

  public static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService()
    }
    return AuthenticationService.instance
  }

  /**
   * Store authentication request in Chrome storage
   */
  public async storeAuthenticationRequest(request: AuthenticationRequest): Promise<void> {
    try {
      if (!this.isChromeStorageAvailable()) {
        throw new Error('Chrome storage not available')
      }

      const result = await (window.chrome as any).storage.local.get([this.storageKey])
      const authRequests = result[this.storageKey] || {}
      
      authRequests[request.requestId] = {
        ...request,
        createdAt: new Date().toISOString(),
        status: 'pending',
        startTime: Date.now()
      }
      
      await (window.chrome as any).storage.local.set({ [this.storageKey]: authRequests })
      console.log('AuthenticationService: Request stored successfully:', request.requestId)
    } catch (error) {
      console.error('AuthenticationService: Failed to store request:', error)
      throw error
    }
  }

  /**
   * Get authentication request by ID
   */
  public async getAuthenticationRequest(requestId: string): Promise<AuthenticationRequest | null> {
    try {
      if (!this.isChromeStorageAvailable()) {
        return null
      }

      const result = await (window.chrome as any).storage.local.get([this.storageKey])
      const authRequests = result[this.storageKey] || {}
      
      return authRequests[requestId] || null
    } catch (error) {
      console.error('AuthenticationService: Failed to get request:', error)
      return null
    }
  }

  /**
   * Get pending authentication request
   */
  public async getPendingAuthenticationRequest(): Promise<AuthenticationRequest | null> {
    try {
      if (!this.isChromeStorageAvailable()) {
        return null
      }

      const result = await (window.chrome as any).storage.local.get([this.storageKey])
      const authRequests = result[this.storageKey] || {}
      
      const pendingRequest = Object.values(authRequests).find((request: any) => 
        request.status === 'pending'
      ) as AuthenticationRequest | undefined
      
      return pendingRequest || null
    } catch (error) {
      console.error('AuthenticationService: Failed to get pending request:', error)
      return null
    }
  }

  /**
   * Update authentication status
   */
  public async updateAuthenticationStatus(requestId: string, status: AuthenticationRequest['status']): Promise<void> {
    try {
      if (!this.isChromeStorageAvailable()) {
        throw new Error('Chrome storage not available')
      }

      const result = await (window.chrome as any).storage.local.get([this.storageKey])
      const authRequests = result[this.storageKey] || {}
      
      if (requestId && authRequests[requestId]) {
        authRequests[requestId].status = status
        await (window.chrome as any).storage.local.set({ [this.storageKey]: authRequests })
        console.log('AuthenticationService: Updated status for request:', requestId, 'to:', status)
      }
    } catch (error) {
      console.error('AuthenticationService: Failed to update status:', error)
      throw error
    }
  }

  /**
   * Clear authentication status
   */
  public async clearAuthenticationStatus(requestId: string, status: AuthenticationRequest['status']): Promise<void> {
    try {
      await this.updateAuthenticationStatus(requestId, status)
      
      // Send message to background script
      if (this.isChromeRuntimeAvailable()) {
        await (window.chrome as any).runtime.sendMessage({
          type: `AUTHENTICATION_${status?.toUpperCase()}`,
          requestId: requestId
        })
        console.log('AuthenticationService: Sent status update to background script')
      }
    } catch (error) {
      console.error('AuthenticationService: Failed to clear status:', error)
      throw error
    }
  }

  /**
   * Get timeout configuration
   */
  public async getTimeoutConfig(): Promise<number> {
    try {
      // Try Chrome storage first
      if (this.isChromeStorageAvailable()) {
        const result = await (window.chrome as any).storage.local.get([this.timeoutKey])
        if (result[this.timeoutKey]) {
          console.log('AuthenticationService: Got timeout from Chrome storage:', result[this.timeoutKey])
          return result[this.timeoutKey]
        }
      }
      
      // Try parent window
      if (window.parent && window.parent !== window) {
        const parentTimeout = (window.parent as any).openExtensionTimeoutSeconds
        if (parentTimeout && typeof parentTimeout === 'number') {
          console.log('AuthenticationService: Got timeout from parent window:', parentTimeout)
          return parentTimeout
        }
      }
      
      // Try localStorage
      const storedTimeout = localStorage.getItem(this.timeoutConfig.localStorageKey)
      if (storedTimeout) {
        const timeout = parseInt(storedTimeout, 10)
        if (!isNaN(timeout) && timeout > 0) {
          console.log('AuthenticationService: Using timeout from localStorage:', timeout)
          return timeout
        }
      }
    } catch (error) {
      console.log('AuthenticationService: Could not get timeout config:', error)
    }
    
    console.log('AuthenticationService: Using default timeout:', this.timeoutConfig.defaultTimeoutSeconds)
    return this.timeoutConfig.defaultTimeoutSeconds
  }

  /**
   * Calculate remaining time for authentication
   */
  public async calculateRemainingTime(startTime: number): Promise<number> {
    const timeoutSeconds = await this.getTimeoutConfig()
    const now = Date.now()
    const elapsed = Math.floor((now - startTime) / 1000)
    return Math.max(0, timeoutSeconds - elapsed)
  }

  /**
   * Send authentication status update to background script
   */
  public async sendStatusUpdate(status: AuthenticationRequest['status'], requestId: string): Promise<void> {
    try {
      if (!this.isChromeRuntimeAvailable()) {
        throw new Error('Chrome runtime not available')
      }

      await (window.chrome as any).runtime.sendMessage({
        type: 'AUTHENTICATION_STATUS_UPDATE',
        status: status,
        requestId: requestId
      })
      console.log('AuthenticationService: Sent status update:', status, 'for request:', requestId)
    } catch (error) {
      console.error('AuthenticationService: Failed to send status update:', error)
      throw error
    }
  }

  /**
   * Dispatch authentication status update event
   */
  public dispatchStatusUpdateEvent(status: AuthenticationRequest['status'], requestId: string): void {
    window.dispatchEvent(new CustomEvent('MirrorStackWalletAuthUpdate', {
      detail: {
        status: status,
        requestId: requestId
      }
    }))
    console.log('AuthenticationService: Dispatched status update event:', status, 'for request:', requestId)
  }

  /**
   * Check if Chrome storage is available
   */
  private isChromeStorageAvailable(): boolean {
    return !!(window.chrome as any)?.storage?.local
  }

  /**
   * Check if Chrome runtime is available
   */
  private isChromeRuntimeAvailable(): boolean {
    return !!(window.chrome as any)?.runtime?.sendMessage
  }

  /**
   * Generate unique request ID
   */
  public generateRequestId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Validate authentication request
   */
  public validateAuthenticationRequest(request: Partial<AuthenticationRequest>): boolean {
    return !!(request.sourceUrl && request.destinationUrl && request.requestId)
  }
}

export default AuthenticationService 