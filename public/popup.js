// Popup script for MirrorStack Wallet Browser Extension
// Handles popup functionality and communication with background script

class PopupService {
  constructor() {
    this.isInitialized = false
    this.securityStatus = 'UNKNOWN'
  }

  /**
   * Initialize the popup service
   */
  async initialize() {
    try {
      console.log('MirrorStack Wallet: Initializing popup service...')

      // Set up event listeners
      this.setupEventListeners()

      // Get initial security status
      await this.getSecurityStatus()

      // Update UI
      this.updateUI()

      this.isInitialized = true
      console.log('MirrorStack Wallet: Popup service initialized successfully')
    } catch (error) {
      console.error('MirrorStack Wallet: Popup service initialization failed:', error)
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Security check button
    const securityCheckBtn = document.getElementById('security-check-btn')
    if (securityCheckBtn) {
      securityCheckBtn.addEventListener('click', () => {
        this.runSecurityCheck()
      })
    }

    // Settings button
    const settingsBtn = document.getElementById('settings-btn')
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openSettings()
      })
    }

    // About button
    const aboutBtn = document.getElementById('about-btn')
    if (aboutBtn) {
      aboutBtn.addEventListener('click', () => {
        this.openAbout()
      })
    }
  }

  /**
   * Get security status from background script
   */
  async getSecurityStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SECURITY_STATUS',
      })

      if (response.success) {
        this.securityStatus = response.data.status
        console.log('MirrorStack Wallet: Security status:', this.securityStatus)
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Could not get security status:', error)
    }
  }

  /**
   * Run security check
   */
  async runSecurityCheck() {
    try {
      console.log('MirrorStack Wallet: Running security check...')

      // Update button state
      const securityCheckBtn = document.getElementById('security-check-btn')
      if (securityCheckBtn) {
        securityCheckBtn.textContent = 'Checking...'
        securityCheckBtn.disabled = true
      }

      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'SECURITY_CHECK_REQUEST',
      })

      if (response.success) {
        console.log('MirrorStack Wallet: Security check completed:', response.data)
        this.securityStatus = response.data.securityStatus
        this.updateUI()

        // Show success message
        this.showNotification('Security check completed successfully!', 'success')
      } else {
        throw new Error(response.error || 'Security check failed')
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Security check failed:', error)
      this.showNotification('Security check failed: ' + error.message, 'error')
    } finally {
      // Reset button state
      const securityCheckBtn = document.getElementById('security-check-btn')
      if (securityCheckBtn) {
        securityCheckBtn.textContent = 'Run Security Check'
        securityCheckBtn.disabled = false
      }
    }
  }

  /**
   * Open settings page
   */
  openSettings() {
    chrome.runtime.openOptionsPage()
  }

  /**
   * Open about page
   */
  openAbout() {
    // Create about popup
    this.showAboutPopup()
  }

  /**
   * Show about popup
   */
  showAboutPopup() {
    const popup = document.createElement('div')
    popup.className = 'about-popup'

    // Create safe DOM structure instead of using innerHTML
    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 10001;
      min-width: 300px;
      max-width: 400px;
    `

    const title = document.createElement('h3')
    title.style.cssText = 'margin: 0 0 16px 0; color: #236488; text-align: center;'
    title.textContent = 'MirrorStack Wallet'
    container.appendChild(title)

    const versionDiv = document.createElement('div')
    versionDiv.style.marginBottom = '12px'
    versionDiv.innerHTML = '<strong>Version:</strong> 1.0.0'
    container.appendChild(versionDiv)

    const descDiv = document.createElement('div')
    descDiv.style.marginBottom = '12px'
    descDiv.innerHTML =
      '<strong>Description:</strong> Enterprise-grade cryptocurrency wallet with ZKP authentication and HSM integration'
    container.appendChild(descDiv)

    const featuresDiv = document.createElement('div')
    featuresDiv.style.marginBottom = '16px'
    featuresDiv.innerHTML = '<strong>Security Features:</strong>'

    const featuresList = document.createElement('ul')
    featuresList.style.cssText = 'margin: 8px 0 0 0; padding-left: 20px;'

    const features = [
      'Hardware Security Module (HSM) integration',
      'Biometric authentication',
      'Device fingerprinting',
      'Zero-Knowledge Proof (ZKP) authentication',
    ]

    features.forEach((feature) => {
      const li = document.createElement('li')
      li.textContent = feature
      featuresList.appendChild(li)
    })

    featuresDiv.appendChild(featuresList)
    container.appendChild(featuresDiv)

    const closeButton = document.createElement('button')
    closeButton.textContent = 'Close'
    closeButton.style.cssText = `
      width: 100%;
      background: #236488;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    `
    closeButton.addEventListener('click', () => {
      popup.remove()
    })
    container.appendChild(closeButton)

    popup.appendChild(container)
    document.body.appendChild(popup)

    // Remove popup when clicking outside
    popup.addEventListener('click', (event) => {
      if (event.target === popup) {
        popup.remove()
      }
    })
  }

  /**
   * Update UI based on current state
   */
  updateUI() {
    // Update security status indicators
    this.updateSecurityStatus()

    // Update button states based on security status
    this.updateButtonStates()
  }

  /**
   * Update security status display
   */
  updateSecurityStatus() {
    const statusItems = document.querySelectorAll('.status-text')

    statusItems.forEach((item, index) => {
      const isSuccess =
        this.securityStatus === 'SECURE' || this.securityStatus === 'PARTIALLY_SECURE'

      if (isSuccess) {
        item.className = 'status-text status-success'
      } else {
        item.className = 'status-text status-error'
      }
    })
  }

  /**
   * Update button states
   */
  updateButtonStates() {
    const securityCheckBtn = document.getElementById('security-check-btn')

    if (securityCheckBtn) {
      if (this.securityStatus === 'SECURE') {
        securityCheckBtn.textContent = 'Security Check Passed'
        securityCheckBtn.style.backgroundColor = '#059669'
      } else if (this.securityStatus === 'PARTIALLY_SECURE') {
        securityCheckBtn.textContent = 'Security Check Warning'
        securityCheckBtn.style.backgroundColor = '#d97706'
      } else {
        securityCheckBtn.textContent = 'Run Security Check'
        securityCheckBtn.style.backgroundColor = '#236488'
      }
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Sanitize message to prevent XSS
    const sanitizedMessage = this.sanitizeHTML(message)

    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#059669' : '#236488'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
    `

    const messageElement = document.createElement('div')
    messageElement.textContent = sanitizedMessage
    notification.appendChild(messageElement)

    document.body.appendChild(notification)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 5000)
  }

  /**
   * Sanitize HTML to prevent XSS attacks
   */
  sanitizeHTML(input) {
    const div = document.createElement('div')
    div.textContent = input
    return div.textContent || div.innerText || ''
  }

  /**
   * Get extension information
   */
  async getExtensionInfo() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_EXTENSION_INFO',
      })

      if (response.success) {
        console.log('MirrorStack Wallet: Extension info:', response.data)
        return response.data
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Could not get extension info:', error)
    }
  }
}

// Initialize popup service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const popupService = new PopupService()
  popupService.initialize().catch((error) => {
    console.error('MirrorStack Wallet: Popup service initialization failed:', error)
  })
})
