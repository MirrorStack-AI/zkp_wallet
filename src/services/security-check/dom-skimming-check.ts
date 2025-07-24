/**
 * DOM-based Data Skimming Security Check
 * Protects against sensitive data being exposed to web page scripts
 */

import { BaseSecurityCheck } from './base-check'
import { SecurityCheckStep } from './types'

interface DOMSkimmingStatus {
  isProtected: boolean
  hasSensitiveDataInDOM: boolean
  hasSecureUIElements: boolean
  hasIsolatedStorage: boolean
  error?: string
}

export class DOMSkimmingCheck extends BaseSecurityCheck {
  private readonly SENSITIVE_PATTERNS = [
    /password/i,
    /credit.?card/i,
    /ssn|social.?security/i,
    /private.?key/i,
    /secret/i,
    /token/i,
    /api.?key/i,
    /wallet.?address/i,
    /private/i,
  ]

  getName(): string {
    return 'DOM Skimming Protection Check'
  }

  isEnabled(): boolean {
    return this.config.enableDOMProtection
  }

  async execute(): Promise<{ success: boolean; data?: DOMSkimmingStatus; error?: string }> {
    try {
      this.updateProgress(SecurityCheckStep.DOM_PROTECTION, 88)

      // Check for sensitive data in DOM
      const hasSensitiveDataInDOM = this.checkForSensitiveDataInDOM()

      // Check for secure UI elements (popup, options page, side panel)
      const hasSecureUIElements = this.checkSecureUIElements()

      // Check for isolated storage
      const hasIsolatedStorage = this.checkIsolatedStorage()

      // Overall protection status
      const isProtected = !hasSensitiveDataInDOM && hasSecureUIElements && hasIsolatedStorage

      const domSkimmingStatus: DOMSkimmingStatus = {
        isProtected,
        hasSensitiveDataInDOM,
        hasSecureUIElements,
        hasIsolatedStorage,
      }

      this.state.domSkimmingStatus = domSkimmingStatus
      this.updateProgress(SecurityCheckStep.DOM_PROTECTION, 89)

      return {
        success: isProtected,
        data: domSkimmingStatus,
      }
    } catch (error) {
      const domSkimmingStatus: DOMSkimmingStatus = {
        isProtected: false,
        hasSensitiveDataInDOM: true, // Assume worst case
        hasSecureUIElements: false,
        hasIsolatedStorage: false,
        error: error instanceof Error ? error.message : 'Unknown DOM skimming error',
      }
      this.state.domSkimmingStatus = domSkimmingStatus
      this.updateProgress(SecurityCheckStep.DOM_PROTECTION, 89)

      const result = this.handleError(error as Error, 'DOM skimming protection check failed')
      return {
        success: result.success,
        error: result.error,
      }
    }
  }

  /**
   * Check for sensitive data in DOM that could be accessed by web page scripts
   */
  private checkForSensitiveDataInDOM(): boolean {
    try {
      // Check if we're in a content script context
      if (typeof window !== 'undefined' && window.location) {
        const protocol = window.location.protocol
        const isExtensionContext = protocol === 'chrome-extension:' || protocol === 'moz-extension:'

        // If we're in extension context, DOM is safe
        if (isExtensionContext) {
          return false
        }
      }

      // Check for sensitive data in any accessible DOM elements
      const allElements = document.querySelectorAll('*')
      for (const element of allElements) {
        const textContent = element.textContent || ''
        const innerHTML = element.innerHTML || ''

        // Check for sensitive patterns
        for (const pattern of this.SENSITIVE_PATTERNS) {
          if (pattern.test(textContent) || pattern.test(innerHTML)) {
            console.warn('Sensitive data detected in DOM:', pattern.source)
            return true
          }
        }
      }

      return false
    } catch (error) {
      console.warn('Error checking DOM for sensitive data:', error)
      return true // Assume worst case
    }
  }

  /**
   * Check if secure UI elements are being used instead of DOM injection
   */
  private checkSecureUIElements(): boolean {
    try {
      // Check if we're in a popup context
      const isPopup = window.location.pathname.includes('popup.html')

      // Check if we're in an options page
      const isOptionsPage = window.location.pathname.includes('options.html')

      // Check if we're in extension context (not content script)
      const protocol = window.location.protocol
      const isExtensionContext = protocol === 'chrome-extension:' || protocol === 'moz-extension:'

      // Check for side panel support (Chrome 114+) - use proper type checking
      const chrome = (window as unknown as Record<string, unknown>).chrome
      const hasSidePanel = typeof chrome === 'object' && chrome !== null && 'sidePanel' in chrome

      return (
        isPopup ||
        isOptionsPage ||
        (isExtensionContext && !window.location.href.includes('content-script'))
      )
    } catch (error) {
      console.warn('Error checking secure UI elements:', error)
      return false
    }
  }

  /**
   * Check if storage is properly isolated from web page access
   */
  private checkIsolatedStorage(): boolean {
    try {
      // Check if we're using extension storage instead of localStorage/sessionStorage
      const chrome = (window as unknown as Record<string, unknown>).chrome
      const hasExtensionStorage =
        typeof chrome === 'object' && chrome !== null && 'storage' in chrome

      // Check if we're in extension context
      const protocol = window.location.protocol
      const isExtensionContext = protocol === 'chrome-extension:' || protocol === 'moz-extension:'

      // Extension storage is isolated, web storage is not
      return hasExtensionStorage && isExtensionContext
    } catch (error) {
      console.warn('Error checking isolated storage:', error)
      return false
    }
  }

  /**
   * Validate that no sensitive data is being injected into web page DOM
   */
  public validateNoDOMInjection(data: string): boolean {
    // Check if data contains sensitive information
    for (const pattern of this.SENSITIVE_PATTERNS) {
      if (pattern.test(data)) {
        console.error('Attempted to inject sensitive data into DOM:', data.substring(0, 20) + '...')
        return false
      }
    }
    return true
  }

  /**
   * Get secure alternatives for displaying sensitive data
   */
  public getSecureAlternatives(): string[] {
    return [
      'Use extension popup for sensitive data display',
      'Use options page for user settings',
      'Use side panel for persistent UI (Chrome 114+)',
      'Use chrome.storage instead of localStorage',
      'Never inject sensitive data into web page DOM',
    ]
  }
}
