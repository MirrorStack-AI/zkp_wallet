/**
 * Timeout Service
 * Handles timeout management for authentication and other operations
 */

export interface TimeoutConfig {
  defaultTimeoutSeconds: number
  extensionTimeoutSeconds?: number
  localStorageKey: string
}

export interface TimeoutState {
  isActive: boolean
  timeLeft: number
  startTime: number
  timeoutId?: number
}

export interface TimeoutCallback {
  onTimeout: () => void
  onTick?: (timeLeft: number) => void
  onComplete?: () => void
}

export class TimeoutService {
  private static instance: TimeoutService
  private readonly config: TimeoutConfig
  private activeTimeouts: Map<string, TimeoutState> = new Map()

  private constructor() {
    this.config = {
      defaultTimeoutSeconds: 45,
      localStorageKey: 'openExtensionTimeoutSeconds'
    }
  }

  public static getInstance(): TimeoutService {
    if (!TimeoutService.instance) {
      TimeoutService.instance = new TimeoutService()
    }
    return TimeoutService.instance
  }

  /**
   * Start a timeout with the given configuration
   */
  public async startTimeout(
    timeoutId: string,
    startTime: number,
    callbacks: TimeoutCallback
  ): Promise<number> {
    try {
      // Clear any existing timeout
      this.clearTimeout(timeoutId)

      // Get timeout configuration
      const timeoutSeconds = await this.getTimeoutConfig()
      
      // Calculate remaining time
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      const timeLeft = Math.max(0, timeoutSeconds - elapsed)

      // If already expired, handle timeout immediately
      if (timeLeft <= 0) {
        console.log('TimeoutService: Timeout already expired for:', timeoutId)
        callbacks.onTimeout()
        return 0
      }

      // Create timeout state
      const timeoutState: TimeoutState = {
        isActive: true,
        timeLeft: timeLeft,
        startTime: startTime
      }

      // Start the countdown
      const intervalId = window.setInterval(() => {
        timeoutState.timeLeft--
        
        // Call tick callback if provided
        if (callbacks.onTick) {
          callbacks.onTick(timeoutState.timeLeft)
        }

        if (timeoutState.timeLeft <= 0) {
          this.clearTimeout(timeoutId)
          callbacks.onTimeout()
        }
      }, 1000)

      timeoutState.timeoutId = intervalId
      this.activeTimeouts.set(timeoutId, timeoutState)

      console.log('TimeoutService: Started timeout for:', timeoutId, 'with', timeLeft, 'seconds remaining')
      return timeLeft
    } catch (error) {
      console.error('TimeoutService: Failed to start timeout:', error)
      throw error
    }
  }

  /**
   * Clear a specific timeout
   */
  public clearTimeout(timeoutId: string): void {
    const timeoutState = this.activeTimeouts.get(timeoutId)
    if (timeoutState && timeoutState.timeoutId) {
      clearInterval(timeoutState.timeoutId)
      timeoutState.isActive = false
      console.log('TimeoutService: Cleared timeout for:', timeoutId)
    }
    this.activeTimeouts.delete(timeoutId)
  }

  /**
   * Clear all active timeouts
   */
  public clearAllTimeouts(): void {
    for (const [timeoutId, timeoutState] of this.activeTimeouts) {
      if (timeoutState.timeoutId) {
        clearInterval(timeoutState.timeoutId)
      }
    }
    this.activeTimeouts.clear()
    console.log('TimeoutService: Cleared all active timeouts')
  }

  /**
   * Get remaining time for a specific timeout
   */
  public getRemainingTime(timeoutId: string): number {
    const timeoutState = this.activeTimeouts.get(timeoutId)
    return timeoutState ? timeoutState.timeLeft : 0
  }

  /**
   * Check if a timeout is active
   */
  public isTimeoutActive(timeoutId: string): boolean {
    const timeoutState = this.activeTimeouts.get(timeoutId)
    return timeoutState ? timeoutState.isActive : false
  }

  /**
   * Get timeout configuration from various sources
   */
  public async getTimeoutConfig(): Promise<number> {
    try {
      // Try Chrome storage first
      if (this.isChromeStorageAvailable()) {
        const result = await (window.chrome as any).storage.local.get(['extensionTimeoutSeconds'])
        if (result.extensionTimeoutSeconds) {
          console.log('TimeoutService: Got timeout from Chrome storage:', result.extensionTimeoutSeconds)
          return result.extensionTimeoutSeconds
        }
      }
      
      // Try parent window
      if (window.parent && window.parent !== window) {
        const parentTimeout = (window.parent as any).openExtensionTimeoutSeconds
        if (parentTimeout && typeof parentTimeout === 'number') {
          console.log('TimeoutService: Got timeout from parent window:', parentTimeout)
          return parentTimeout
        }
      }
      
      // Try localStorage
      const storedTimeout = localStorage.getItem(this.config.localStorageKey)
      if (storedTimeout) {
        const timeout = parseInt(storedTimeout, 10)
        if (!isNaN(timeout) && timeout > 0) {
          console.log('TimeoutService: Using timeout from localStorage:', timeout)
          return timeout
        }
      }
    } catch (error) {
      console.log('TimeoutService: Could not get timeout config:', error)
    }
    
    console.log('TimeoutService: Using default timeout:', this.config.defaultTimeoutSeconds)
    return this.config.defaultTimeoutSeconds
  }

  /**
   * Calculate remaining time based on start time
   */
  public async calculateRemainingTime(startTime: number): Promise<number> {
    const timeoutSeconds = await this.getTimeoutConfig()
    const now = Date.now()
    const elapsed = Math.floor((now - startTime) / 1000)
    return Math.max(0, timeoutSeconds - elapsed)
  }

  /**
   * Check if Chrome storage is available
   */
  private isChromeStorageAvailable(): boolean {
    return !!(window.chrome as any)?.storage?.local
  }

  /**
   * Get all active timeout IDs
   */
  public getActiveTimeoutIds(): string[] {
    return Array.from(this.activeTimeouts.keys())
  }

  /**
   * Get timeout statistics
   */
  public getTimeoutStats(): { activeCount: number; totalTimeouts: number } {
    const activeCount = this.activeTimeouts.size
    return {
      activeCount,
      totalTimeouts: activeCount
    }
  }
}

export default TimeoutService 