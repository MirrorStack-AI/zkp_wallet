// Options script for MirrorStack Wallet Browser Extension
// Handles settings page functionality

class OptionsService {
  constructor() {
    this.isInitialized = false
    this.settings = {}
  }

  /**
   * Initialize the options service
   */
  async initialize() {
    try {
      console.log('MirrorStack Wallet: Initializing options service...')

      // Load current settings
      await this.loadSettings()

      // Set up event listeners
      this.setupEventListeners()

      // Update UI with current settings
      this.updateUI()

      // Load system status
      await this.loadSystemStatus()

      this.isInitialized = true
      console.log('MirrorStack Wallet: Options service initialized successfully')
    } catch (error) {
      console.error('MirrorStack Wallet: Options service initialization failed:', error)
    }
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get({
        // Default settings
        enableHSM: true,
        enableBiometric: true,
        enableDeviceFingerprinting: true,
        enableZKP: true,
        autoLockTimeout: 300000,
        theme: 'light',
      })

      this.settings = result
      console.log('MirrorStack Wallet: Settings loaded:', this.settings)
    } catch (error) {
      console.error('MirrorStack Wallet: Could not load settings:', error)
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      await chrome.storage.sync.set(this.settings)
      console.log('MirrorStack Wallet: Settings saved:', this.settings)

      // Notify background script of settings change
      chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        data: this.settings,
      })
    } catch (error) {
      console.error('MirrorStack Wallet: Could not save settings:', error)
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Toggle switches
    const toggles = ['hsm', 'biometric', 'fingerprint', 'zkp']
    toggles.forEach((toggle) => {
      const element = document.getElementById(`${toggle}-toggle`)
      if (element) {
        element.addEventListener('click', () => {
          this.toggleSetting(toggle)
        })
      }
    })

    // Select dropdowns
    const autoLockSelect = document.getElementById('auto-lock-timeout')
    if (autoLockSelect) {
      autoLockSelect.addEventListener('change', (event) => {
        this.settings.autoLockTimeout = parseInt(event.target.value)
        this.saveSettings()
      })
    }

    const themeSelect = document.getElementById('theme-select')
    if (themeSelect) {
      themeSelect.addEventListener('change', (event) => {
        this.settings.theme = event.target.value
        this.saveSettings()
      })
    }

    // Action buttons
    const runSecurityCheckBtn = document.getElementById('run-security-check')
    if (runSecurityCheckBtn) {
      runSecurityCheckBtn.addEventListener('click', () => {
        this.runSecurityCheck()
      })
    }

    const exportSettingsBtn = document.getElementById('export-settings')
    if (exportSettingsBtn) {
      exportSettingsBtn.addEventListener('click', () => {
        this.exportSettings()
      })
    }

    const importSettingsBtn = document.getElementById('import-settings')
    if (importSettingsBtn) {
      importSettingsBtn.addEventListener('click', () => {
        this.importSettings()
      })
    }

    const resetSettingsBtn = document.getElementById('reset-settings')
    if (resetSettingsBtn) {
      resetSettingsBtn.addEventListener('click', () => {
        this.resetSettings()
      })
    }
  }

  /**
   * Toggle a setting
   */
  toggleSetting(setting) {
    const settingKey = `enable${setting.charAt(0).toUpperCase() + setting.slice(1)}`
    this.settings[settingKey] = !this.settings[settingKey]

    // Update UI
    this.updateToggleUI(setting, this.settings[settingKey])

    // Save settings
    this.saveSettings()
  }

  /**
   * Update toggle UI
   */
  updateToggleUI(setting, isActive) {
    const toggle = document.getElementById(`${setting}-toggle`)
    const status = document.getElementById(`${setting}-status`)

    if (toggle) {
      if (isActive) {
        toggle.classList.add('active')
      } else {
        toggle.classList.remove('active')
      }
    }

    if (status) {
      if (isActive) {
        status.className = 'status-indicator status-active'
      } else {
        status.className = 'status-indicator status-inactive'
      }
    }
  }

  /**
   * Update UI with current settings
   */
  updateUI() {
    // Update toggles
    this.updateToggleUI('hsm', this.settings.enableHSM)
    this.updateToggleUI('biometric', this.settings.enableBiometric)
    this.updateToggleUI('fingerprint', this.settings.enableDeviceFingerprinting)
    this.updateToggleUI('zkp', this.settings.enableZKP)

    // Update selects
    const autoLockSelect = document.getElementById('auto-lock-timeout')
    if (autoLockSelect) {
      autoLockSelect.value = this.settings.autoLockTimeout
    }

    const themeSelect = document.getElementById('theme-select')
    if (themeSelect) {
      themeSelect.value = this.settings.theme
    }
  }

  /**
   * Load system status
   */
  async loadSystemStatus() {
    try {
      // Get extension info
      const extensionInfo = await this.getExtensionInfo()
      if (extensionInfo) {
        const versionElement = document.getElementById('extension-version')
        if (versionElement) {
          versionElement.textContent = extensionInfo.version
        }
      }

      // Get security status
      const securityStatus = await this.getSecurityStatus()
      if (securityStatus) {
        const lastCheckElement = document.getElementById('last-security-check')
        const overallStatusElement = document.getElementById('overall-security-status')

        if (lastCheckElement) {
          const lastCheck = new Date(securityStatus.lastVerified || Date.now())
          lastCheckElement.textContent = lastCheck.toLocaleString()
        }

        if (overallStatusElement) {
          overallStatusElement.textContent = securityStatus.status || 'Unknown'
        }
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Could not load system status:', error)
    }
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
        return response.data
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Could not get extension info:', error)
    }
  }

  /**
   * Get security status
   */
  async getSecurityStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SECURITY_STATUS',
      })

      if (response.success) {
        return response.data
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
      console.log('MirrorStack Wallet: Running security check from options...')

      const button = document.getElementById('run-security-check')
      if (button) {
        button.textContent = 'Checking...'
        button.disabled = true
      }

      const response = await chrome.runtime.sendMessage({
        type: 'SECURITY_CHECK_REQUEST',
      })

      if (response.success) {
        console.log('MirrorStack Wallet: Security check completed:', response.data)
        this.showNotification('Security check completed successfully!', 'success')

        // Reload system status
        await this.loadSystemStatus()
      } else {
        throw new Error(response.error || 'Security check failed')
      }
    } catch (error) {
      console.error('MirrorStack Wallet: Security check failed:', error)
      this.showNotification('Security check failed: ' + error.message, 'error')
    } finally {
      const button = document.getElementById('run-security-check')
      if (button) {
        button.textContent = 'Run Security Check'
        button.disabled = false
      }
    }
  }

  /**
   * Export settings
   */
  exportSettings() {
    try {
      const dataStr = JSON.stringify(this.settings, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = 'mirrorstack-wallet-settings.json'
      link.click()

      this.showNotification('Settings exported successfully!', 'success')
    } catch (error) {
      console.error('MirrorStack Wallet: Could not export settings:', error)
      this.showNotification('Failed to export settings', 'error')
    }
  }

  /**
   * Import settings
   */
  importSettings() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async (event) => {
      const file = event.target.files[0]
      if (file) {
        try {
          const text = await file.text()
          const importedSettings = JSON.parse(text)

          // Validate settings
          const validSettings = this.validateSettings(importedSettings)
          if (validSettings) {
            this.settings = { ...this.settings, ...validSettings }
            await this.saveSettings()
            this.updateUI()
            this.showNotification('Settings imported successfully!', 'success')
          } else {
            throw new Error('Invalid settings format')
          }
        } catch (error) {
          console.error('MirrorStack Wallet: Could not import settings:', error)
          this.showNotification('Failed to import settings: Invalid format', 'error')
        }
      }
    }

    input.click()
  }

  /**
   * Validate imported settings
   */
  validateSettings(settings) {
    const requiredKeys = [
      'enableHSM',
      'enableBiometric',
      'enableDeviceFingerprinting',
      'enableZKP',
      'autoLockTimeout',
      'theme',
    ]

    const validSettings = {}
    let isValid = true

    requiredKeys.forEach((key) => {
      if (settings.hasOwnProperty(key)) {
        validSettings[key] = settings[key]
      } else {
        isValid = false
      }
    })

    return isValid ? validSettings : null
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        this.settings = {
          enableHSM: true,
          enableBiometric: true,
          enableDeviceFingerprinting: true,
          enableZKP: true,
          autoLockTimeout: 300000,
          theme: 'light',
        }

        await this.saveSettings()
        this.updateUI()
        this.showNotification('Settings reset to defaults!', 'success')
      } catch (error) {
        console.error('MirrorStack Wallet: Could not reset settings:', error)
        this.showNotification('Failed to reset settings', 'error')
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
}

// Initialize options service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const optionsService = new OptionsService()
  optionsService.initialize().catch((error) => {
    console.error('MirrorStack Wallet: Options service initialization failed:', error)
  })
})
