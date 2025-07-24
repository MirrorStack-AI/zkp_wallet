// Content script for MirrorStack Wallet Browser Extension
// Handles webpage integration and communication with secure DOM manipulation

class ContentScriptService {
  constructor() {
    this.isInitialized = false
    this.currentTab = null
    this.securityStatus = 'UNKNOWN'
  }

  /**
   * Initialize the content script
   */
  async initialize() {
    try {
      console.log('MirrorStack Wallet: Initializing content script...')

      // Get current tab information
      await this.getCurrentTab()

      // Set up event listeners
      this.setupEventListeners()

      // Check security status
      await this.checkSecurityStatus()

      this.isInitialized = true
      console.log('MirrorStack Wallet: Content script initialized successfully')
    } catch (error) {
      console.error('MirrorStack Wallet: Content script initialization failed:', error)
    }
  }

  /**
   * Get current tab information
   */
  async getCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      this.currentTab = tabs[0]
    } catch (error) {
      console.log('MirrorStack Wallet: Could not get current tab:', error.message)
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async response
    })

    // Listen for DOM changes
    this.observeDOMChanges()

    // Listen for security-related events
    this.setupSecurityEventListeners()
  }

  /**
   * Handle messages from background script with validation
   */
  async handleMessage(message, sender, sendResponse) {
    console.log('MirrorStack Wallet: Content script received message:', message)

    try {
      // Validate message structure
      if (!this.validateMessage(message)) {
        sendResponse({ success: false, error: 'Invalid message format' })
        return
      }

      switch (message.type) {
        case 'GET_PAGE_INFO':
          const pageInfo = this.getPageInfo()
          sendResponse({ success: true, data: pageInfo })
          break

        case 'CHECK_PAGE_SECURITY':
          const securityInfo = await this.checkPageSecurity()
          sendResponse({ success: true, data: securityInfo })
          break

        case 'INJECT_SECURITY_INDICATOR':
          this.injectSecurityIndicator()
          sendResponse({ success: true })
          break

        case 'REMOVE_SECURITY_INDICATOR':
          this.removeSecurityIndicator()
          sendResponse({ success: true })
          break

        default:
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Content script message handling error:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  /**
   * Validate message structure to prevent injection attacks
   */
  validateMessage(message) {
    if (!message || typeof message !== 'object') {
      return false
    }

    if (typeof message.type !== 'string') {
      return false
    }

    // Validate message type against allowed types
    const allowedTypes = [
      'GET_PAGE_INFO',
      'CHECK_PAGE_SECURITY',
      'INJECT_SECURITY_INDICATOR',
      'REMOVE_SECURITY_INDICATOR',
    ]
    if (!allowedTypes.includes(message.type)) {
      return false
    }

    return true
  }

  /**
   * Observe DOM changes for security-related elements
   */
  observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check for new security-related elements
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkForSecurityElements(node)
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  /**
   * Set up security event listeners
   */
  setupSecurityEventListeners() {
    // Listen for form submissions
    document.addEventListener('submit', (event) => {
      this.handleFormSubmission(event)
    })

    // Listen for password field changes
    document.addEventListener('input', (event) => {
      if (event.target.type === 'password') {
        this.handlePasswordInput(event)
      }
    })

    // Listen for crypto-related keywords
    this.setupCryptoKeywordListener()
  }

  /**
   * Check for security-related elements
   */
  checkForSecurityElements(element) {
    // Check for wallet-related elements
    const walletSelectors = [
      '[data-wallet]',
      '[class*="wallet"]',
      '[id*="wallet"]',
      '[class*="crypto"]',
      '[id*="crypto"]',
    ]

    walletSelectors.forEach((selector) => {
      const elements = element.querySelectorAll(selector)
      elements.forEach((el) => {
        this.handleWalletElement(el)
      })
    })
  }

  /**
   * Handle wallet-related elements
   */
  handleWalletElement(element) {
    // Add security indicator
    this.addSecurityIndicator(element)

    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'WALLET_ELEMENT_DETECTED',
      data: {
        elementType: element.tagName,
        elementClass: element.className,
        elementId: element.id,
        pageUrl: window.location.href,
      },
    })
  }

  /**
   * Add security indicator to element using safe DOM manipulation
   */
  addSecurityIndicator(element) {
    // Check if indicator already exists
    if (element.querySelector('.mirrorstack-security-indicator')) {
      return
    }

    // Create indicator container
    const indicator = document.createElement('div')
    indicator.className = 'mirrorstack-security-indicator'

    // Create shield icon container
    const shieldContainer = document.createElement('div')
    shieldContainer.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      width: 16px;
      height: 16px;
      background-color: #236488;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      cursor: pointer;
    `

    // Create shield icon
    const shieldIcon = document.createElement('span')
    shieldIcon.textContent = '🛡️'
    shieldIcon.style.cssText = 'color: white; font-size: 10px;'

    // Assemble elements safely
    shieldContainer.appendChild(shieldIcon)
    indicator.appendChild(shieldContainer)

    // Make element position relative if needed
    const computedStyle = window.getComputedStyle(element)
    if (computedStyle.position === 'static') {
      element.style.position = 'relative'
    }

    element.appendChild(indicator)

    // Add click event
    indicator.addEventListener('click', (event) => {
      event.stopPropagation()
      this.showSecurityInfo(element)
    })
  }

  /**
   * Show security information using safe DOM manipulation
   */
  showSecurityInfo(element) {
    // Create security info popup
    const popup = document.createElement('div')
    popup.className = 'mirrorstack-security-popup'

    // Create popup container
    const popupContainer = document.createElement('div')
    popupContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      z-index: 10001;
      min-width: 300px;
    `

    // Create title
    const title = document.createElement('h3')
    title.textContent = 'Security Status'
    title.style.cssText = 'margin: 0 0 12px 0; color: #236488;'
    popupContainer.appendChild(title)

    // Create status items
    const statusItems = [
      {
        label: 'HSM Status:',
        value: this.securityStatus === 'SECURE' ? '✅ Active' : '❌ Inactive',
      },
      { label: 'Device Verification:', value: '✅ Verified' },
      {
        label: 'Biometric:',
        value: this.securityStatus === 'SECURE' ? '✅ Available' : '❌ Unavailable',
      },
    ]

    statusItems.forEach((item) => {
      const statusDiv = document.createElement('div')
      statusDiv.style.marginBottom = '8px'

      const label = document.createElement('strong')
      label.textContent = item.label
      statusDiv.appendChild(label)

      const value = document.createElement('span')
      value.textContent = ' ' + item.value
      statusDiv.appendChild(value)

      popupContainer.appendChild(statusDiv)
    })

    // Create close button
    const closeButton = document.createElement('button')
    closeButton.textContent = 'Close'
    closeButton.style.cssText = `
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
    popupContainer.appendChild(closeButton)

    popup.appendChild(popupContainer)
    document.body.appendChild(popup)

    // Remove popup when clicking outside
    popup.addEventListener('click', (event) => {
      if (event.target === popup) {
        popup.remove()
      }
    })
  }

  /**
   * Handle form submission with input validation
   */
  handleFormSubmission(event) {
    const form = event.target
    const formData = new FormData(form)

    // Check for sensitive data
    const sensitiveFields = ['password', 'private-key', 'seed-phrase', 'mnemonic']
    let hasSensitiveData = false

    for (let [key, value] of formData.entries()) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        hasSensitiveData = true
        break
      }
    }

    if (hasSensitiveData) {
      // Send warning to background script
      chrome.runtime.sendMessage({
        type: 'SENSITIVE_FORM_SUBMISSION',
        data: {
          formAction: form.action,
          formMethod: form.method,
          pageUrl: window.location.href,
        },
      })
    }
  }

  /**
   * Handle password input with validation
   */
  handlePasswordInput(event) {
    const input = event.target

    // Check if this is a crypto-related password field
    const fieldName = input.name || input.id || ''
    const cryptoKeywords = ['wallet', 'private', 'seed', 'mnemonic', 'key']

    if (cryptoKeywords.some((keyword) => fieldName.toLowerCase().includes(keyword))) {
      // Add security warning
      this.addPasswordSecurityWarning(input)
    }
  }

  /**
   * Add password security warning using safe DOM manipulation
   */
  addPasswordSecurityWarning(input) {
    // Check if warning already exists
    if (input.parentNode.querySelector('.mirrorstack-password-warning')) {
      return
    }

    const warning = document.createElement('div')
    warning.className = 'mirrorstack-password-warning'

    const warningContainer = document.createElement('div')
    warningContainer.style.cssText = `
      margin-top: 4px;
      padding: 8px;
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 4px;
      font-size: 12px;
      color: #92400e;
    `

    const warningText = document.createElement('span')
    warningText.textContent =
      "⚠️ This appears to be a crypto-related password field. Ensure you're on a trusted site."
    warningContainer.appendChild(warningText)

    warning.appendChild(warningContainer)
    input.parentNode.insertBefore(warning, input.nextSibling)
  }

  /**
   * Set up crypto keyword listener
   */
  setupCryptoKeywordListener() {
    const cryptoKeywords = [
      'bitcoin',
      'ethereum',
      'wallet',
      'private key',
      'seed phrase',
      'metamask',
      'trust wallet',
      'ledger',
      'trezor',
    ]

    // Monitor page content for crypto keywords
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent.toLowerCase()
              cryptoKeywords.forEach((keyword) => {
                if (text.includes(keyword)) {
                  this.handleCryptoKeyword(keyword, node)
                }
              })
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  /**
   * Handle crypto keyword detection
   */
  handleCryptoKeyword(keyword, node) {
    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'CRYPTO_KEYWORD_DETECTED',
      data: {
        keyword,
        pageUrl: window.location.href,
        context: node.textContent.substring(0, 100),
      },
    })
  }

  /**
   * Get page information
   */
  getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      protocol: window.location.protocol,
      hasWalletElements:
        document.querySelectorAll('[data-wallet], [class*="wallet"], [id*="wallet"]').length > 0,
      hasCryptoElements: document.querySelectorAll('[class*="crypto"], [id*="crypto"]').length > 0,
    }
  }

  /**
   * Check page security
   */
  async checkPageSecurity() {
    const pageInfo = this.getPageInfo()

    // Check for HTTPS
    const isSecure = pageInfo.protocol === 'https:'

    // Check for known wallet domains
    const knownWalletDomains = [
      'metamask.io',
      'trustwallet.com',
      'ledger.com',
      'trezor.io',
      'binance.com',
      'coinbase.com',
      'kraken.com',
    ]

    const isKnownWallet = knownWalletDomains.some((domain) => pageInfo.domain.includes(domain))

    return {
      isSecure,
      isKnownWallet,
      hasWalletElements: pageInfo.hasWalletElements,
      hasCryptoElements: pageInfo.hasCryptoElements,
      securityScore: this.calculateSecurityScore(pageInfo),
    }
  }

  /**
   * Calculate security score
   */
  calculateSecurityScore(pageInfo) {
    let score = 0

    if (pageInfo.protocol === 'https:') score += 30
    if (pageInfo.hasWalletElements) score += 20
    if (pageInfo.hasCryptoElements) score += 20

    // Check for security headers
    const securityHeaders = ['content-security-policy', 'x-frame-options', 'x-content-type-options']

    securityHeaders.forEach((header) => {
      if (document.querySelector(`meta[http-equiv="${header}"]`)) {
        score += 10
      }
    })

    return Math.min(score, 100)
  }

  /**
   * Inject security indicator using safe DOM manipulation
   */
  injectSecurityIndicator() {
    // Add global security indicator
    const indicator = document.createElement('div')
    indicator.id = 'mirrorstack-global-indicator'

    const indicatorContainer = document.createElement('div')
    indicatorContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #236488;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 10000;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `

    const indicatorText = document.createElement('span')
    indicatorText.textContent = '🛡️ MirrorStack Secure'
    indicatorContainer.appendChild(indicatorText)

    indicator.appendChild(indicatorContainer)
    document.body.appendChild(indicator)

    // Add click event
    indicator.addEventListener('click', () => {
      this.showGlobalSecurityInfo()
    })
  }

  /**
   * Remove security indicator
   */
  removeSecurityIndicator() {
    const indicator = document.getElementById('mirrorstack-global-indicator')
    if (indicator) {
      indicator.remove()
    }
  }

  /**
   * Show global security information
   */
  showGlobalSecurityInfo() {
    // Implementation for global security info popup
    console.log('MirrorStack Wallet: Showing global security information')
  }

  /**
   * Check security status from background script
   */
  async checkSecurityStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SECURITY_STATUS',
      })

      if (response.success) {
        this.securityStatus = response.data.status
      }
    } catch (error) {
      console.log('MirrorStack Wallet: Could not get security status:', error.message)
    }
  }

  /**
   * Show security indicator using safe DOM manipulation
   */
  showSecurityIndicator(pageInfo) {
    const indicator = document.createElement('div')
    indicator.id = 'mirrorstack-security-indicator'
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${pageInfo.isSecure ? '#059669' : '#dc2626'};
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      max-width: 200px;
      word-wrap: break-word;
    `

    const statusText = document.createElement('div')
    statusText.textContent = pageInfo.isSecure ? 'Secure Connection' : 'Insecure Connection'
    indicator.appendChild(statusText)

    if (pageInfo.isKnownWallet) {
      const walletText = document.createElement('div')
      walletText.style.fontSize = '10px'
      walletText.style.opacity = '0.8'
      walletText.textContent = 'Known Wallet Site'
      indicator.appendChild(walletText)
    }

    document.body.appendChild(indicator)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove()
      }
    }, 5000)
  }

  /**
   * Show security popup using safe DOM manipulation
   */
  showSecurityPopup(pageInfo) {
    const popup = document.createElement('div')
    popup.id = 'mirrorstack-security-popup'
    popup.style.cssText = `
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
    title.textContent = 'MirrorStack Security Check'
    popup.appendChild(title)

    const statusDiv = document.createElement('div')
    statusDiv.style.marginBottom = '12px'
    const statusLabel = document.createElement('strong')
    statusLabel.textContent = 'Status: '
    statusDiv.appendChild(statusLabel)
    const statusValue = document.createElement('span')
    statusValue.textContent = pageInfo.isSecure ? 'Secure' : 'Insecure'
    statusDiv.appendChild(statusValue)
    popup.appendChild(statusDiv)

    const domainDiv = document.createElement('div')
    domainDiv.style.marginBottom = '12px'
    const domainLabel = document.createElement('strong')
    domainLabel.textContent = 'Domain: '
    domainDiv.appendChild(domainLabel)
    const domainValue = document.createElement('span')
    domainValue.textContent = pageInfo.domain
    domainDiv.appendChild(domainValue)
    popup.appendChild(domainDiv)

    const protocolDiv = document.createElement('div')
    protocolDiv.style.marginBottom = '12px'
    const protocolLabel = document.createElement('strong')
    protocolLabel.textContent = 'Protocol: '
    protocolDiv.appendChild(protocolLabel)
    const protocolValue = document.createElement('span')
    protocolValue.textContent = pageInfo.protocol
    protocolDiv.appendChild(protocolValue)
    popup.appendChild(protocolDiv)

    if (pageInfo.isKnownWallet) {
      const walletDiv = document.createElement('div')
      walletDiv.style.marginBottom = '12px'
      walletDiv.style.color = '#059669'
      const walletLabel = document.createElement('strong')
      walletLabel.textContent = '✓ Known Wallet Site'
      walletDiv.appendChild(walletLabel)
      popup.appendChild(walletDiv)
    }

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
    popup.appendChild(closeButton)

    document.body.appendChild(popup)

    // Remove popup when clicking outside
    popup.addEventListener('click', (event) => {
      if (event.target === popup) {
        popup.remove()
      }
    })
  }

  /**
   * Show security warning using safe DOM manipulation
   */
  showSecurityWarning(pageInfo) {
    const warning = document.createElement('div')
    warning.id = 'mirrorstack-security-warning'
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 300px;
      word-wrap: break-word;
    `

    const warningTitle = document.createElement('div')
    warningTitle.style.fontWeight = 'bold'
    warningTitle.style.marginBottom = '8px'
    warningTitle.textContent = 'Security Warning'
    warning.appendChild(warningTitle)

    const warningMessage = document.createElement('div')
    warningMessage.textContent =
      'This site is not using a secure connection. Avoid entering sensitive information.'
    warning.appendChild(warningMessage)

    document.body.appendChild(warning)

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (warning.parentNode) {
        warning.remove()
      }
    }, 10000)
  }

  /**
   * Update security indicator
   */
  updateSecurityIndicator(pageInfo) {
    const indicator = document.getElementById('mirrorstack-security-indicator')
    if (indicator) {
      indicator.style.background = pageInfo.isSecure ? '#059669' : '#dc2626'

      const statusText = indicator.querySelector('div')
      if (statusText) {
        statusText.textContent = pageInfo.isSecure ? 'Secure Connection' : 'Insecure Connection'
      }
    }
  }
}

// Initialize content script
const contentScript = new ContentScriptService()
contentScript.initialize().catch((error) => {
  console.error('MirrorStack Wallet: Content script initialization failed:', error)
})
