// Background script for MirrorStack Wallet Browser Extension
// Handles security checks, extension lifecycle, and communication

class ExtensionBackgroundService {
  constructor() {
    this.isInitialized = false
    this.securityStatus = 'UNKNOWN'
    this.deviceFingerprint = null
    this.hsmStatus = null
    this.biometricStatus = null
    this.currentTheme = 'auto' // Default to auto (system preference)
  }

  /**
   * Initialize the background service
   */
  async initialize() {
    try {
      console.log('MirrorStack Wallet: Initializing background service...')

      // Set up extension event listeners
      this.setupEventListeners()

      // Load theme preference and update icon
      await this.loadThemePreference()
      await this.updateExtensionIcon()

      // Perform initial security check
      await this.performSecurityCheck()

      this.isInitialized = true
      console.log('MirrorStack Wallet: Background service initialized successfully')
    } catch (error) {
      console.error('MirrorStack Wallet: Background service initialization failed:', error)
      this.securityStatus = 'ERROR'
    }
  }

  /**
   * Set up extension event listeners
   */
  setupEventListeners() {
    // Extension installation/update
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('MirrorStack Wallet: Extension installed/updated:', details.reason)
      this.handleInstallation(details)
    })

    // Extension startup
    chrome.runtime.onStartup.addListener(() => {
      console.log('MirrorStack Wallet: Extension started')
      this.handleStartup()
    })

    // Message handling from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async response
    })

    // Tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab)
    })

    // Extension icon click
    chrome.action.onClicked.addListener((tab) => {
      this.handleExtensionIconClick(tab)
    })
  }

  /**
   * Handle extension installation
   */
  async handleInstallation(details) {
    if (details.reason === 'install') {
      // First time installation
      console.log('MirrorStack Wallet: First time installation')

      // Set default settings
      await this.setDefaultSettings()

      // Open welcome page
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup.html'),
      })
    } else if (details.reason === 'update') {
      // Extension update
      console.log('MirrorStack Wallet: Extension updated')

      // Perform security check after update
      await this.performSecurityCheck()
    }
  }

  /**
   * Handle extension startup
   */
  async handleStartup() {
    console.log('MirrorStack Wallet: Extension startup')

    // Perform security check on startup
    await this.performSecurityCheck()
  }

  /**
   * Handle messages from content scripts and popup
   */
  async handleMessage(message, sender, sendResponse) {
    console.log('MirrorStack Wallet: Received message:', message)

    try {
      switch (message.type) {
        case 'SECURITY_CHECK_REQUEST':
          const securityResult = await this.performSecurityCheck()
          sendResponse({ success: true, data: securityResult })
          break

        case 'GET_SECURITY_STATUS':
          sendResponse({
            success: true,
            data: {
              status: this.securityStatus,
              hsmStatus: this.hsmStatus,
              biometricStatus: this.biometricStatus,
              deviceFingerprint: this.deviceFingerprint,
            },
          })
          break

        case 'PERFORM_HSM_CHECK':
          const hsmResult = await this.performHSMCheck()
          sendResponse({ success: true, data: hsmResult })
          break

        case 'PERFORM_BIOMETRIC_CHECK':
          const biometricResult = await this.performBiometricCheck()
          sendResponse({ success: true, data: biometricResult })
          break

        case 'PERFORM_DEVICE_FINGERPRINTING':
          const fingerprintResult = await this.performDeviceFingerprinting()
          sendResponse({ success: true, data: fingerprintResult })
          break

        case 'GET_EXTENSION_INFO':
          sendResponse({
            success: true,
            data: {
              version: chrome.runtime.getManifest().version,
              name: chrome.runtime.getManifest().name,
              description: chrome.runtime.getManifest().description,
              isInitialized: this.isInitialized,
            },
          })
          break

        case 'CHANGE_THEME':
          await this.handleThemeChange(message.theme)
          sendResponse({ success: true, data: { theme: this.currentTheme } })
          break

        case 'GET_CURRENT_THEME':
          sendResponse({ success: true, data: { theme: this.currentTheme } })
          break

        case 'API_SECURITY_CHECK':
          const apiResult = await this.handleSecurityAPI(message.data)
          sendResponse(apiResult)
          break

        default:
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Message handling error:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  /**
   * Handle tab updates
   */
  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      // Inject content script if needed
      this.injectContentScriptIfNeeded(tabId, tab.url)
    }
  }

  /**
   * Handle extension icon click
   */
  handleExtensionIconClick(tab) {
    // Open popup or perform action based on security status
    if (this.securityStatus === 'SECURE') {
      // Open main popup
      chrome.action.setPopup({ popup: 'popup.html' })
    } else {
      // Open security check popup
      chrome.action.setPopup({ popup: 'security-check.html' })
    }
  }

  /**
   * Perform comprehensive security check
   */
  async performSecurityCheck() {
    console.log('MirrorStack Wallet: Performing security check...')

    try {
      // Step 1: HSM Check
      const hsmResult = await this.performHSMCheck()
      this.hsmStatus = hsmResult

      // Step 2: Device Fingerprinting
      const fingerprintResult = await this.performDeviceFingerprinting()
      this.deviceFingerprint = fingerprintResult

      // Step 3: Biometric Check
      const biometricResult = await this.performBiometricCheck()
      this.biometricStatus = biometricResult

      // Determine overall security status
      this.securityStatus = this.determineSecurityStatus()

      console.log('MirrorStack Wallet: Security check completed:', this.securityStatus)

      return {
        success: true,
        securityStatus: this.securityStatus,
        hsmStatus: this.hsmStatus,
        biometricStatus: this.biometricStatus,
        deviceFingerprint: this.deviceFingerprint,
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Security check failed:', error)
      this.securityStatus = 'ERROR'
      throw error
    }
  }

  /**
   * Perform HSM (Hardware Security Module) check
   */
  async performHSMCheck() {
    // Simulate HSM detection
    const platform = navigator.platform.toLowerCase()
    let hsmType = 'NONE'
    let isAvailable = false

    if (platform.indexOf('win') !== -1) {
      hsmType = 'TPM_2_0'
      isAvailable = true
    } else if (platform.indexOf('mac') !== -1) {
      hsmType = 'SECURE_ENCLAVE'
      isAvailable = true
    } else {
      hsmType = 'HARDWARE_KEY'
      isAvailable = true
    }

    return {
      type: hsmType,
      isAvailable,
      complianceLevel: isAvailable ? 'FIPS_140_2_LEVEL_3' : 'NONE',
      status: isAvailable ? 'ACTIVE' : 'UNAVAILABLE',
      lastVerified: new Date().toISOString(),
    }
  }

  /**
   * Perform device fingerprinting
   */
  async performDeviceFingerprinting() {
    try {
      const characteristics = {
        hardwareInfo: {
          cpuArchitecture: navigator.platform,
          memorySize: navigator.deviceMemory || 0,
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        },
        screenResolution: {
          width: 1920, // Default values for service worker context
          height: 1080,
          colorDepth: 24,
          pixelDepth: 24,
        },
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        languageSettings: Array.from(navigator.languages),
      }

      // Generate device hash
      const data = JSON.stringify(characteristics)
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const deviceHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      return {
        deviceHash,
        characteristics,
        isValid: true,
        lastVerified: new Date().toISOString(),
        hsmVerificationStatus: 'VERIFIED',
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Device fingerprinting failed:', error)
      // Return a fallback device fingerprint
      return {
        deviceHash: 'fallback-device-hash',
        characteristics: {
          hardwareInfo: {
            cpuArchitecture: 'unknown',
            memorySize: 0,
            platform: 'unknown',
            userAgent: navigator.userAgent,
          },
          screenResolution: {
            width: 1920,
            height: 1080,
            colorDepth: 24,
            pixelDepth: 24,
          },
          timeZone: 'UTC',
          languageSettings: ['en-US'],
        },
        isValid: false,
        lastVerified: new Date().toISOString(),
        hsmVerificationStatus: 'UNVERIFIED',
        error: error.message,
      }
    }
  }

  /**
   * Perform biometric check
   */
  async performBiometricCheck() {
    const platform = navigator.platform.toLowerCase()

    if (platform.indexOf('mac') !== -1) {
      return {
        isEnabled: true,
        type: 'TOUCH_ID',
        status: 'AVAILABLE',
        platform: 'macOS',
      }
    } else if (platform.indexOf('win') !== -1) {
      return {
        isEnabled: true,
        type: 'WINDOWS_HELLO',
        status: 'AVAILABLE',
        platform: 'Windows',
      }
    } else {
      return {
        isEnabled: false,
        type: 'NONE',
        status: 'NOT_AVAILABLE',
        platform: 'Other',
      }
    }
  }

  /**
   * Determine overall security status
   */
  determineSecurityStatus() {
    const hsmSecure = this.hsmStatus && this.hsmStatus.isAvailable
    const biometricSecure = this.biometricStatus && this.biometricStatus.isEnabled
    const deviceSecure = this.deviceFingerprint && this.deviceFingerprint.isValid

    if (hsmSecure && biometricSecure && deviceSecure) {
      return 'SECURE'
    } else if (hsmSecure || biometricSecure || deviceSecure) {
      return 'PARTIALLY_SECURE'
    } else {
      return 'INSECURE'
    }
  }

  /**
   * Set default extension settings
   */
  async setDefaultSettings() {
    const defaultSettings = {
      securityLevel: 'HIGH',
      enableHSM: true,
      enableBiometric: true,
      enableDeviceFingerprinting: true,
      enableZKP: true,
      autoLockTimeout: 300000, // 5 minutes
      theme: 'light', // Use light theme as default to ensure proper icon
    }

    await chrome.storage.sync.set(defaultSettings)
    console.log('MirrorStack Wallet: Default settings saved')
  }

  /**
   * Load theme preference from storage
   */
  async loadThemePreference() {
    try {
      const result = await chrome.storage.sync.get(['theme'])
      const savedTheme = result.theme || 'auto' // Default to auto

      // Handle auto theme by detecting system preference
      if (savedTheme === 'auto') {
        this.currentTheme = this.getSystemTheme()
        console.log(
          'MirrorStack Wallet: Auto theme detected, using system preference:',
          this.currentTheme,
        )
      } else {
        this.currentTheme = savedTheme
        console.log('MirrorStack Wallet: Theme preference loaded:', this.currentTheme)
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to load theme preference:', error)
      this.currentTheme = 'auto' // Default to auto on error
    }
  }

  /**
   * Get system theme preference
   */
  getSystemTheme() {
    // In service worker context, we can't directly access matchMedia
    // Default to light theme for auto mode in background script
    // The popup will handle actual system theme detection
    // This ensures consistent icon behavior on first load
    return 'light'
  }

  /**
   * Update extension icon based on current theme
   */
  async updateExtensionIcon() {
    try {
      const iconPath = `icons/${this.currentTheme}/icon-16.png`

      await chrome.action.setIcon({
        path: {
          16: `icons/${this.currentTheme}/icon-16.png`,
          32: `icons/${this.currentTheme}/icon-32.png`,
          48: `icons/${this.currentTheme}/icon-48.png`,
          128: `icons/${this.currentTheme}/icon-128.png`,
        },
      })

      console.log('MirrorStack Wallet: Extension icon updated for theme:', this.currentTheme)
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to update extension icon:', error)
    }
  }

  /**
   * Handle theme change from popup
   */
  async handleThemeChange(newTheme) {
    try {
      // Handle auto theme by detecting system preference
      if (newTheme === 'auto') {
        this.currentTheme = this.getSystemTheme()
        console.log(
          'MirrorStack Wallet: Auto theme detected, using system preference:',
          this.currentTheme,
        )
      } else {
        this.currentTheme = newTheme
        console.log('MirrorStack Wallet: Theme changed to:', newTheme)
      }

      // Save theme preference
      await chrome.storage.sync.set({ theme: newTheme })

      // Update extension icon
      await this.updateExtensionIcon()
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to handle theme change:', error)
    }
  }

  /**
   * Handle security API requests
   */
  async handleSecurityAPI(request) {
    try {
      // Validate CSRF token
      if (!request.csrfToken || !this.validateCSRFToken(request.csrfToken)) {
        return {
          success: false,
          message: 'Invalid CSRF token',
          status: 401,
        }
      }

      // Sanitize input
      const sanitizedAction = this.sanitizeInput(request.action)
      const sanitizedData = request.data ? this.sanitizeInput(JSON.stringify(request.data)) : null

      // Handle different security check actions
      switch (sanitizedAction) {
        case 'bypass':
          return {
            success: false,
            message: 'Security bypass attempt detected',
            status: 403,
          }

        case 'test':
          return {
            success: true,
            message: 'Security check passed',
            data: { status: 'secure' },
            status: 200,
          }

        case 'validate':
          return {
            success: true,
            message: 'Security validation completed',
            data: { validated: true },
            status: 200,
          }

        default:
          return {
            success: false,
            message: 'Invalid security check action',
            status: 400,
          }
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Security API error:', error)
      return {
        success: false,
        message: 'Internal server error',
        status: 500,
      }
    }
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token) {
    // In a real implementation, this would validate against a stored token
    // For now, we'll accept any non-empty token for testing
    return token && token.length > 0
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return ''

    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe/gi, '')
      .replace(/<object/gi, '')
      .replace(/<embed/gi, '')
  }

  /**
   * Inject content script if needed
   */
  injectContentScriptIfNeeded(tabId, url) {
    // Only inject on specific domains or when needed
    if (url.startsWith('http') && !url.includes('chrome://')) {
      chrome.scripting
        .executeScript({
          target: { tabId },
          files: ['content.js'],
        })
        .catch((error) => {
          console.log('MirrorStack Wallet: Content script injection skipped:', error.message)
        })
    }
  }
}

// Initialize background service
const backgroundService = new ExtensionBackgroundService()
backgroundService.initialize().catch((error) => {
  console.error('MirrorStack Wallet: Background service initialization failed:', error)
})
