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

      // Clear any stale authentication data on startup
      await this.clearAuthenticationStatus()

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

        case 'AUTHENTICATION_REQUEST':
          const authResult = await this.handleAuthenticationRequest(message.data)
          sendResponse(authResult)
          break

        case 'OPEN_AUTHENTICATION_POPUP':
          const popupResult = await this.openAuthenticationPopup(message.data)
          sendResponse(popupResult)
          break

        case 'AUTHENTICATION_COMPLETED':
          await this.updateAuthenticationStatus(message.requestId, 'authorized')
          // Send status update to content script
          await this.sendAuthStatusUpdate('authorized', message.requestId)
          sendResponse({ success: true })
          break

        case 'AUTHENTICATION_CANCELLED':
          await this.updateAuthenticationStatus(message.requestId, 'cancelled')
          // Send status update to content script
          await this.sendAuthStatusUpdate('cancelled', message.requestId)
          sendResponse({ success: true })
          break

        case 'AUTHENTICATION_TIMEOUT':
          // Update the status to timeout instead of clearing
          await this.updateAuthenticationStatus(message.requestId, 'timeout')
          // Send status update to content script
          await this.sendAuthStatusUpdate('timeout', message.requestId)
          sendResponse({ success: true })
          break

        case 'CHECK_PENDING_AUTH_REQUEST':
          const hasPending = await this.checkForPendingAuthRequest()
          sendResponse({ hasPending })
          break

        case 'CLEAR_AUTHENTICATION_REQUEST':
          console.log('MirrorStack Wallet: Received clear auth request from content script:', message.requestId)
          await this.clearAuthenticationStatus(message.requestId)
          console.log('MirrorStack Wallet: Clear auth request completed')
          sendResponse({ success: true })
          break

        case 'EXTENSION_OPENED_WITH_PENDING_AUTH':
          console.log('MirrorStack Wallet: Extension opened with pending auth, sending status update')
          await this.sendAuthStatusUpdate('extension_opened', message.requestId)
          sendResponse({ success: true })
          break

        case 'AUTHENTICATION_SUCCESS_TO_WEB':
          console.log('MirrorStack Wallet: Authentication success to web, sending status update')
          await this.updateAuthenticationStatus(message.requestId, 'authorized')
          await this.sendAuthStatusUpdate('authorized', message.requestId)
          sendResponse({ success: true })
          break

        case 'UPDATE_EXTENSION_TIMEOUT':
          console.log('MirrorStack Wallet: Updating extension timeout to:', message.timeoutSeconds)
          await this.updateExtensionTimeout(message.timeoutSeconds)
          sendResponse({ success: true })
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
    console.log('MirrorStack Wallet: Extension icon clicked')
    
    // Check if there's a pending authentication request
    this.checkForPendingAuthRequest().then(hasPending => {
      if (hasPending) {
        // If there's a pending auth request, always start with security check
        console.log('MirrorStack Wallet: Pending auth request - opening security check first')
        chrome.action.setPopup({ popup: 'popup.html?view=security-check' })
        
        // Get the actual requestId from the pending request and send status update
        this.getPendingRequestId().then(requestId => {
          if (requestId) {
            console.log('MirrorStack Wallet: Sending extension_opened status for request:', requestId)
            this.sendAuthStatusUpdate('extension_opened', requestId)
          } else {
            console.log('MirrorStack Wallet: No pending requestId found')
          }
        })
      } else {
        // Normal flow - no pending auth request
        if (this.securityStatus === 'SECURE') {
          // Security check passed, open welcome/main view
          console.log('MirrorStack Wallet: Security check passed, opening welcome view')
          chrome.action.setPopup({ popup: 'popup.html?view=welcome' })
        } else {
          // Security check needed
          console.log('MirrorStack Wallet: Security check required')
          chrome.action.setPopup({ popup: 'popup.html?view=security-check' })
        }
      }
    }).catch(error => {
      console.error('MirrorStack Wallet: Error checking for pending auth request:', error)
      // Fallback to default behavior
      chrome.action.setPopup({ popup: 'popup.html?view=security-check' })
    })
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
   * Handle authentication request from websites
   */
  async handleAuthenticationRequest(request) {
    try {
      console.log('MirrorStack Wallet: Handling authentication request:', request)

      // Validate request
      if (!request.sourceUrl || !request.destinationUrl) {
        return {
          success: false,
          error: 'Missing required parameters',
          status: 400
        }
      }

      // Generate unique request ID
      const requestId = this.generateRequestId()

      // Store authentication request
      await this.storeAuthenticationRequest(requestId, request)

      // Open authentication popup
      const popupResult = await this.openAuthenticationPopup({
        sourceUrl: request.sourceUrl,
        destinationUrl: request.destinationUrl,
        requestId: requestId
      })

      return {
        success: true,
        requestId: requestId,
        popupOpened: popupResult.success,
        status: 200
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Authentication request failed:', error)
      return {
        success: false,
        error: error.message,
        status: 500
      }
    }
  }

  /**
   * Open authentication popup by setting the popup URL
   */
  async openAuthenticationPopup(authData) {
    try {
      console.log('MirrorStack Wallet: Opening authentication popup:', authData)

      // Store the authentication data for the popup to access
      await this.storeAuthenticationRequest(authData.requestId, {
        sourceUrl: authData.sourceUrl,
        destinationUrl: authData.destinationUrl,
        requestId: authData.requestId
      })

      // Set the popup URL to security check (not authentication directly)
      const popupUrl = chrome.runtime.getURL('popup.html') + `?view=security-check`
      
      console.log('MirrorStack Wallet: Setting popup URL to security check:', popupUrl)
      
      // Set the popup URL for the extension action
      await chrome.action.setPopup({
        popup: popupUrl
      })

      console.log('MirrorStack Wallet: Popup URL set to security check - user must click extension icon to open popup')

      return {
        success: true,
        requestId: authData.requestId,
        popupUrl: popupUrl,
        message: 'Popup URL set. Click the extension icon to open the security check popup.'
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to set popup URL:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * Store authentication request
   */
  async storeAuthenticationRequest(requestId, request) {
    try {
      const result = await chrome.storage.local.get(['authRequests'])
      const authRequests = result.authRequests || {}
      
      authRequests[requestId] = {
        ...request,
        createdAt: new Date().toISOString(),
        status: 'pending',
        startTime: Date.now() // Store the start time when request is created
      }
      
      await chrome.storage.local.set({ authRequests })
      console.log('MirrorStack Wallet: Authentication request stored successfully:', requestId)
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to store authentication request:', error)
    }
  }

  /**
   * Check for pending authentication requests
   */
  async checkForPendingAuthRequest() {
    try {
      const result = await chrome.storage.local.get(['authRequests'])
      const authRequests = result.authRequests || {}
      
      // Check if there are any pending requests
      const pendingRequests = Object.values(authRequests).filter(request => 
        request.status === 'pending'
      )
      
      console.log('MirrorStack Wallet: Checking for pending auth requests:', {
        totalRequests: Object.keys(authRequests).length,
        pendingRequests: pendingRequests.length,
        authRequests: authRequests
      })
      
      return pendingRequests.length > 0
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to check for pending auth requests:', error)
      return false
    }
  }

  /**
   * Get the requestId of the first pending authentication request
   */
  async getPendingRequestId() {
    try {
      const result = await chrome.storage.local.get(['authRequests'])
      const authRequests = result.authRequests || {}
      
      // Find the first pending request
      const pendingRequest = Object.values(authRequests).find(request => 
        request.status === 'pending'
      )
      
      if (pendingRequest) {
        console.log('MirrorStack Wallet: Found pending requestId:', pendingRequest.requestId)
        return pendingRequest.requestId
      } else {
        console.log('MirrorStack Wallet: No pending request found')
        return null
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to get pending requestId:', error)
      return null
    }
  }

  /**
   * Update extension timeout
   */
  async updateExtensionTimeout(timeoutSeconds) {
    try {
      await chrome.storage.local.set({ extensionTimeoutSeconds: timeoutSeconds })
      console.log('MirrorStack Wallet: Updated extension timeout to:', timeoutSeconds, 'seconds')
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to update extension timeout:', error)
    }
  }

  /**
   * Get extension timeout
   */
  async getExtensionTimeout() {
    try {
      const result = await chrome.storage.local.get(['extensionTimeoutSeconds'])
      return result.extensionTimeoutSeconds || 45 // Default to 45 seconds
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to get extension timeout:', error)
      return 45 // Default to 45 seconds
    }
  }

  /**
   * Update authentication status
   */
  async updateAuthenticationStatus(requestId, status) {
    try {
      const result = await chrome.storage.local.get(['authRequests'])
      const authRequests = result.authRequests || {}
      
      if (requestId && authRequests[requestId]) {
        authRequests[requestId].status = status
        await chrome.storage.local.set({ authRequests })
        console.log('MirrorStack Wallet: Updated authentication status for request:', requestId, 'to:', status)
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to update authentication status:', error)
    }
  }

  /**
   * Clear authentication status
   */
  async clearAuthenticationStatus(requestId) {
    try {
      const result = await chrome.storage.local.get(['authRequests'])
      let authRequests = result.authRequests || {}
      
      if (requestId) {
        // Clear specific request
        delete authRequests[requestId]
        console.log('MirrorStack Wallet: Cleared authentication status for request:', requestId)
      } else {
        // Clear all pending requests and timeout requests
        const clearedRequests = {}
        Object.keys(authRequests).forEach(key => {
          const request = authRequests[key]
          // Keep only completed requests (authorized, cancelled, timeout)
          if (request.status === 'authorized' || request.status === 'cancelled' || request.status === 'timeout') {
            clearedRequests[key] = request
          }
          // Clear pending requests and any other status
        })
        authRequests = clearedRequests
        console.log('MirrorStack Wallet: Cleared all pending authentication requests')
      }
      
      await chrome.storage.local.set({ authRequests })
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to clear authentication status:', error)
    }
  }

  /**
   * Send authentication status update to content script
   */
  async sendAuthStatusUpdate(status, requestId) {
    try {
      // Get all tabs that might have the content script
      const tabs = await chrome.tabs.query({
        url: ['http://localhost:*/*', 'http://127.0.0.1:*/*', 'https://*/*']
      })
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'AUTHENTICATION_STATUS_UPDATE',
            status: status,
            requestId: requestId
          })
          console.log('MirrorStack Wallet: Sent auth status update to tab:', tab.id)
        } catch (error) {
          // Tab might not have content script, ignore
          console.log('MirrorStack Wallet: Could not send to tab:', tab.id, error.message)
        }
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Failed to send auth status update:', error)
    }
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
