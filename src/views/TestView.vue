<template>
  <div class="relative w-full test-container" data-testid="test-view">
    <ContainerMain>
      <div class="flex flex-col items-center justify-center text-center gap-4">
        <!-- Title -->
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-on-surface">
            <span class="security-text" data-testid="test-title">Test Authentication Trigger</span>
          </h1>
        </div>

        <!-- Extension Status -->
        <div class="w-full max-w-md">
          <div class="bg-surface-variant rounded-lg p-4">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Extension Available:</span>
                <span :class="extensionAvailable ? 'text-green-500' : 'text-red-500'">
                  {{ extensionAvailable ? '✓ Yes' : '✗ No' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Extension Version:</span>
                <span class="text-on-surface-variant">{{ extensionInfo.version || 'Unknown' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Features:</span>
                <span class="text-on-surface-variant">{{ extensionInfo.features?.join(', ') || 'None' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeout Configuration -->
        <div class="w-full max-w-md">
          <div class="bg-surface-variant rounded-lg p-4">
            <div class="space-y-4 text-sm">
              <!-- Not Open Extension Timeout -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span>Not Open Extension Timeout:</span>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      v-model="notOpenExtensionTimeoutSeconds"
                      min="5"
                      max="120"
                      class="w-16 px-2 py-1 text-xs border border-outline rounded bg-surface text-on-surface"
                      @change="updateNotOpenTimeout"
                    />
                    <span class="text-xs text-on-surface-variant">seconds</span>
                  </div>
                </div>
                <div class="text-xs text-on-surface-variant">
                  Time before clearing if user doesn't open extension
                </div>
              </div>
              
              <!-- Open Extension Timeout -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span>Open Extension Timeout:</span>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      v-model="openExtensionTimeoutSeconds"
                      min="10"
                      max="300"
                      class="w-16 px-2 py-1 text-xs border border-outline rounded bg-surface text-on-surface"
                      @change="updateOpenTimeout"
                    />
                    <span class="text-xs text-on-surface-variant">seconds</span>
                  </div>
                </div>
                <div class="text-xs text-on-surface-variant">
                  Time before clearing if user opens extension but doesn't complete auth
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Authentication Status -->
        <div class="w-full max-w-md">
          <div class="bg-surface-variant rounded-lg p-4">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Authentication Status:</span>
                <span :class="getAuthStatusColor()">{{ getAuthStatusText() }}</span>
              </div>
              <div v-if="authRequestId" class="flex justify-between">
                <span>Request ID:</span>
                <span class="text-on-surface-variant font-mono text-xs">{{ authRequestId }}</span>
              </div>
              <div v-if="authTimestamp" class="flex justify-between">
                <span>Last Updated:</span>
                <span class="text-on-surface-variant text-xs">{{ formatTimestamp(authTimestamp) }}</span>
              </div>
              <div class="flex justify-between">
                <span>User Opened Extension:</span>
                <span :class="userOpenedExtension ? 'text-green-500' : 'text-red-500'">
                  {{ userOpenedExtension ? '✓ Yes' : '✗ No' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Test Buttons -->
        <div class="w-full max-w-md space-y-4">
          <!-- Trigger Authentication Button -->
          <button
            class="w-full h-14 px-6 bg-primary text-on-primary rounded-2xl transition-all duration-300 hover:bg-primary-container hover:text-on-primary-container hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] group"
            data-testid="trigger-auth-button"
            @click="triggerAuthentication"
            :disabled="!extensionAvailable || isTriggering"
          >
            <div class="flex items-center justify-center gap-3">
              <span v-if="isTriggering" class="animate-spin material-symbols-rounded text-xl">sync</span>
              <span v-else class="material-symbols-rounded text-xl">lock</span>
              <span class="text-lg font-medium">
                {{ isTriggering ? 'Triggering...' : 'Trigger Authentication' }}
              </span>
            </div>
          </button>



          <!-- Check Extension Button -->
          <button
            class="w-full h-12 px-6 border-2 border-tertiary text-tertiary rounded-2xl transition-all duration-300 hover:bg-tertiary-container hover:text-on-tertiary-container hover:scale-[1.02] hover:shadow-lg hover:shadow-tertiary/25 active:scale-[0.98] group"
            data-testid="check-extension-button"
            @click="checkExtension"
            :disabled="isChecking"
          >
            <div class="flex items-center justify-center gap-3">
              <span v-if="isChecking" class="animate-spin material-symbols-rounded text-xl">sync</span>
              <span v-else class="material-symbols-rounded text-xl">refresh</span>
              <span class="text-lg font-medium">
                {{ isChecking ? 'Checking...' : 'Check Extension Status' }}
              </span>
            </div>
          </button>
        </div>


        <!-- Back Button -->
        <div class="w-full max-w-md">
          <button
            class="w-full h-12 px-6 border-2 border-outline text-on-surface rounded-2xl transition-all duration-300 hover:bg-surface-variant hover:text-on-surface-variant hover:scale-[1.02] hover:shadow-lg hover:shadow-outline/25 active:scale-[0.98] group"
            data-testid="back-button"
            @click="goBack"
          >
            <div class="flex items-center justify-center gap-3">
              <span class="material-symbols-rounded text-xl">arrow_back</span>
              <span class="text-lg font-medium">Back to Security Check</span>
            </div>
          </button>
        </div>
      </div>
    </ContainerMain>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ContainerMain from '@/components/ContainerMain.vue'

// Emits
const emit = defineEmits<{
  'go-back': []
}>()

// Reactive state
const extensionAvailable = ref(false)
const extensionInfo = ref({
  version: '',
  features: [] as string[]
})
const isTriggering = ref(false)
const isChecking = ref(false)

// Authentication status
const authStatus = ref<'idle' | 'pending' | 'authorized' | 'cancelled' | 'timeout' | 'extension_opened'>('idle')
const authRequestId = ref('')
const authTimestamp = ref<Date | null>(null)
const userOpenedExtension = ref(false) // Track if user actually opened the extension

// Methods
const checkExtension = async () => {
  try {
    isChecking.value = true
    
    // Check if extension is available with multiple fallbacks
    const api = (window as any).MirrorStackWallet || (window as any).__MirrorStackWalletBackup
    
    if (api && typeof api.requestAuthentication === 'function') {
      extensionAvailable.value = true
      
      // Get extension info
      try {
        const info = await api.getInfo()
        if (info.success) {
          extensionInfo.value = {
            version: info.data?.version || '1.0.0',
            features: info.data?.features || ['authentication', 'security-check']
          }
        } else {
          console.log('TestView: Extension info failed:', info.error)
          // Still mark as available if API exists but info fails
          extensionInfo.value = {
            version: '0.1.0',
            features: ['authentication', 'security-check']
          }
        }
      } catch (infoError) {
        console.log('TestView: Extension info error, but API is available:', infoError)
        // Mark as available even if info fails
        extensionInfo.value = {
          version: '0.1.0',
          features: ['authentication', 'security-check']
        }
      }
    } else {
      extensionAvailable.value = false
      extensionInfo.value = { version: '', features: [] }
      console.log('TestView: Extension API not found or incomplete')
      console.log('TestView: Available APIs:', {
        MirrorStackWallet: !!(window as any).MirrorStackWallet,
        Backup: !!(window as any).__MirrorStackWalletBackup,
        Chrome: typeof (window as any).chrome !== 'undefined'
      })
    }
  } catch (error) {
    console.error('TestView: Extension check failed:', error)
    extensionAvailable.value = false
    extensionInfo.value = { version: '', features: [] }
  } finally {
    isChecking.value = false
  }
}

const triggerAuthentication = async () => {
  try {
    isTriggering.value = true
    
    if (!extensionAvailable.value) {
      console.log('TestView: Extension not available for authentication')
      return
    }

    // Try multiple API sources
    const api = (window as any).MirrorStackWallet || (window as any).__MirrorStackWalletBackup
    
    if (!api || typeof api.requestAuthentication !== 'function') {
      console.error('TestView: MirrorStackWallet API not available')
      console.log('TestView: Available APIs:', {
        MirrorStackWallet: !!(window as any).MirrorStackWallet,
        Backup: !!(window as any).__MirrorStackWalletBackup
      })
      return
    }

    console.log('TestView: Triggering authentication...')
    
    // Trigger authentication with default URLs
    const result = await api.requestAuthentication(
      'https://test.mirrorstack.ai',
      'https://work.mirrorstack.ai'
    )

    console.log('TestView: Authentication result:', result)
    
    if (result.success) {
      console.log('TestView: Authentication triggered successfully, request ID:', result.requestId)
      // Update authentication status
      authStatus.value = 'pending'
      authRequestId.value = result.requestId || ''
      authTimestamp.value = new Date()
      userOpenedExtension.value = false // Reset flag
      
      // Start web timeout to clear status if user doesn't open extension
      startWebTimeout(result.requestId)
    } else {
      console.error('TestView: Authentication failed:', result.error)
      authStatus.value = 'idle'
    }
  } catch (error) {
    console.error('TestView: Authentication trigger failed:', error)
    authStatus.value = 'idle'
  } finally {
    isTriggering.value = false
  }
}

// Timeout configuration using timestamps
const notOpenExtensionTimeoutSeconds = ref(10) // Default 10 seconds - if user doesn't open extension
const openExtensionTimeoutSeconds = ref(45) // Default 45 seconds - if user opens extension but doesn't complete auth
const authStartTime = ref<number>(0) // Timestamp when authentication was triggered
const webTimeoutId = ref<number | null>(null)

// Test properties for testing
const testResults = ref([])
const isRunning = ref(false)

const startWebTimeout = (requestId: string) => {
  // Clear any existing timeout
  if (webTimeoutId.value) {
    clearTimeout(webTimeoutId.value)
  }
  
  // Store the start time
  authStartTime.value = Date.now()
  
  console.log('TestView: Starting web timeout for request:', requestId, `Timeout will trigger in ${notOpenExtensionTimeoutSeconds.value} seconds`)
  
  // Set configurable timeout
  webTimeoutId.value = window.setTimeout(async () => {
    // Only trigger if user hasn't opened the extension
    if (!userOpenedExtension.value) {
      console.log('TestView: WEB TIMEOUT TRIGGERED - User did not open extension, clearing pending status for request:', requestId)
      
      try {
        // Try to clear the authentication status via the API
        const api = (window as any).MirrorStackWallet || (window as any).__MirrorStackWalletBackup
        if (api && typeof api.clearAuthenticationStatus === 'function') {
          console.log('TestView: Calling clearAuthenticationStatus API')
          const result = await api.clearAuthenticationStatus(requestId)
          console.log('TestView: Clear auth status result:', result)
        } else {
          console.log('TestView: API not available for clearing auth status')
        }
      } catch (error) {
        console.error('TestView: Failed to clear auth status via API:', error)
      }
      
      // Update local status regardless of API result
      authStatus.value = 'timeout'
      authTimestamp.value = new Date()
      
      console.log('TestView: Authentication timed out due to user not opening extension')
    } else {
      console.log('TestView: WEB TIMEOUT TRIGGERED - But user opened extension, ignoring web timeout and waiting for extension timeout')
    }
  }, notOpenExtensionTimeoutSeconds.value * 1000) // Convert seconds to milliseconds
}

const clearWebTimeout = () => {
  if (webTimeoutId.value) {
    clearTimeout(webTimeoutId.value)
    webTimeoutId.value = null
  }
}

const updateNotOpenTimeout = () => {
  // Ensure timeout is within valid range
  if (notOpenExtensionTimeoutSeconds.value < 5) {
    notOpenExtensionTimeoutSeconds.value = 5
  } else if (notOpenExtensionTimeoutSeconds.value > 120) {
    notOpenExtensionTimeoutSeconds.value = 120
  }
  
  console.log('TestView: Not open extension timeout updated to:', notOpenExtensionTimeoutSeconds.value, 'seconds')
}

const updateOpenTimeout = async () => {
  // Ensure timeout is within valid range
  if (openExtensionTimeoutSeconds.value < 10) {
    openExtensionTimeoutSeconds.value = 10
  } else if (openExtensionTimeoutSeconds.value > 300) {
    openExtensionTimeoutSeconds.value = 300
  }
  
  // Store in localStorage for AuthenticationView to access
  try {
    localStorage.setItem('openExtensionTimeoutSeconds', openExtensionTimeoutSeconds.value.toString())
  } catch (error) {
    console.log('TestView: Could not store timeout in localStorage:', error)
  }
  
  // Send timeout to background script for extension popup
  try {
    const api = (window as any).MirrorStackWallet || (window as any).__MirrorStackWalletBackup
    if (api && typeof api.sendMessage === 'function') {
      await api.sendMessage({
        type: 'UPDATE_EXTENSION_TIMEOUT',
        timeoutSeconds: openExtensionTimeoutSeconds.value
      })
      console.log('TestView: Sent timeout update to background script:', openExtensionTimeoutSeconds.value, 'seconds')
    } else {
      console.log('TestView: API not available for sending timeout update')
    }
  } catch (error) {
    console.error('TestView: Failed to send timeout update to background script:', error)
  }
  
  console.log('TestView: Open extension timeout updated to:', openExtensionTimeoutSeconds.value, 'seconds')
}

// Authentication status methods
const getAuthStatusText = () => {
  switch (authStatus.value) {
    case 'idle':
      return 'Idle'
    case 'pending':
      return '⏳ Pending'
    case 'extension_opened':
      return '🔓 Extension Opened'
    case 'authorized':
      return '✓ Authorized'
    case 'cancelled':
      return '✗ Cancelled'
    case 'timeout':
      return '⏰ Timeout'
    default:
      return 'Unknown'
  }
}

const getAuthStatusColor = () => {
  switch (authStatus.value) {
    case 'idle':
      return 'text-on-surface-variant'
    case 'pending':
      return 'text-yellow-500'
    case 'extension_opened':
      return 'text-blue-500'
    case 'authorized':
      return 'text-green-500'
    case 'cancelled':
      return 'text-red-500'
    case 'timeout':
      return 'text-orange-500'
    default:
      return 'text-on-surface-variant'
  }
}

const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleTimeString()
}

// Listen for authentication status updates
const handleAuthStatusUpdate = (event: CustomEvent) => {
  console.log('TestView: Authentication status update received (from extension popup):', event.detail)
  const { status, requestId } = event.detail
  
  authStatus.value = status
  if (requestId) {
    authRequestId.value = requestId
  }
  authTimestamp.value = new Date()
  
  // Mark that user opened the extension (any status update means they opened it)
  if (status === 'extension_opened') {
    console.log('TestView: Extension opened with pending auth, clearing web timeout')
    userOpenedExtension.value = true
    clearWebTimeout()
  } else if (status === 'authorized' || status === 'cancelled' || status === 'timeout') {
    console.log('TestView: Authentication completed, clearing web timeout')
    userOpenedExtension.value = true
    clearWebTimeout()
  } else {
    console.log('TestView: Other status update:', status)
  }
}

// Check if extension timeout should trigger based on timestamp
const checkExtensionTimeout = async () => {
  if (!authStartTime.value || !userOpenedExtension.value) {
    return false
  }
  
  const now = Date.now()
  const elapsedSeconds = Math.floor((now - authStartTime.value) / 1000)
  const shouldTimeout = elapsedSeconds >= openExtensionTimeoutSeconds.value
  
  if (shouldTimeout && authStatus.value === 'extension_opened') {
    console.log('TestView: Extension timeout triggered based on timestamp:', elapsedSeconds, 'seconds elapsed')
    
    // Clear the authentication status via the API
    try {
      const api = (window as any).MirrorStackWallet || (window as any).__MirrorStackWalletBackup
      if (api && typeof api.clearAuthenticationStatus === 'function') {
        console.log('TestView: Calling clearAuthenticationStatus API for extension timeout')
        const result = await api.clearAuthenticationStatus(authRequestId.value)
        console.log('TestView: Clear auth status result for extension timeout:', result)
      } else {
        console.log('TestView: API not available for clearing auth status on extension timeout')
      }
    } catch (error) {
      console.error('TestView: Failed to clear auth status via API on extension timeout:', error)
    }
    
    // Update local status regardless of API result
    authStatus.value = 'timeout'
    authTimestamp.value = new Date()
    return true
  }
  
  return false
}

// Listen for authentication status updates from content script
const handleAuthStatusUpdateFromContent = async (event: MessageEvent) => {
  if (event.data && event.data.type === 'MIRRORSTACK_AUTH_STATUS_UPDATE') {
    console.log('TestView: Authentication status update from content script (from extension popup):', event.data)
    const { status, requestId } = event.data
    
    authStatus.value = status
    if (requestId) {
      authRequestId.value = requestId
    }
    authTimestamp.value = new Date()
    
    // Mark that user opened the extension (any status update means they opened it)
    if (status === 'extension_opened') {
      console.log('TestView: Extension opened with pending auth, clearing web timeout')
      userOpenedExtension.value = true
      clearWebTimeout()
      
             // Check if extension timeout should trigger immediately
       await checkExtensionTimeout()
    } else if (status === 'authorized' || status === 'cancelled' || status === 'timeout') {
      console.log('TestView: Authentication completed, clearing web timeout')
      userOpenedExtension.value = true
      clearWebTimeout()
    } else {
      console.log('TestView: Other status update:', status)
    }
  }
}



// Listen for extension ready event
const handleExtensionReady = (event: CustomEvent) => {
  console.log('TestView: Extension ready event received:', event.detail)
  extensionAvailable.value = true
  extensionInfo.value = {
    version: event.detail.version || '0.1.0',
    features: event.detail.features || ['authentication', 'security-check']
  }
}

// Navigation method
const goBack = () => {
  console.log('TestView: Going back to security check')
  // Navigate back to the root path
  window.history.pushState({}, '', '/')
  // Emit event to parent component
  emit('go-back')
}

// Initialize the component
onMounted(() => {
  console.log('TestView: Component mounted')
  
  // Initialize timeout in localStorage
  try {
    localStorage.setItem('openExtensionTimeoutSeconds', openExtensionTimeoutSeconds.value.toString())
  } catch (error) {
    console.log('TestView: Could not initialize timeout in localStorage:', error)
  }
  
  // Listen for extension ready event
  window.addEventListener('MirrorStackWalletReady', handleExtensionReady as EventListener)
  
  // Listen for authentication status updates
  window.addEventListener('MirrorStackWalletAuthUpdate', handleAuthStatusUpdate as EventListener)
  
  // Listen for authentication status updates from content script
  window.addEventListener('message', handleAuthStatusUpdateFromContent)
  
  // Check extension status on mount
  checkExtension()
  
       // Set up periodic check for extension timeout
     const extensionTimeoutCheck = setInterval(async () => {
       if (authStatus.value === 'extension_opened') {
         await checkExtensionTimeout()
       }
     }, 1000) // Check every second
  
  // Store the interval for cleanup
  ;(window as any).__extensionTimeoutCheck = extensionTimeoutCheck
})

// Cleanup
onUnmounted(() => {
  // Clear extension timeout check interval
  if ((window as any).__extensionTimeoutCheck) {
    clearInterval((window as any).__extensionTimeoutCheck)
  }
})
</script>

<style scoped>
.test-container {
  height: 100vh !important;
  min-height: 100vh !important;
}

/* Override popup height constraints for test view */
:deep(.max-w-\[400px\]) {
  max-width: none !important;
  width: 100% !important;
}

:deep(.w-full) {
  width: 100% !important;
}

/* Ensure the container takes full height */
:deep(.relative) {
  height: 100vh !important;
  min-height: 100vh !important;
}
</style> 