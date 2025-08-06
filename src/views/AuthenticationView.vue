<template>
  <div class="relative w-full h-full" data-testid="authentication-view">
    <ContainerMain>
      <div class="flex flex-col items-center justify-center gap-4 px-4 text-center">
        <!-- add materian icon -->
        <div class="w-16 h-16 w-full flex items-center justify-center" data-testid="encrypted-icon">
          <span class="material-symbols-rounded text-primary" style="font-size: 48px">encrypted</span>
        </div>

        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-on-surface">
            <span class="security-text" data-testid="security-checking-title"
              >ZKP Authentication</span>
          </h1>
          <p class="text-sm text-on-surface-variant">Authorize this authentication request?</p>
        </div>

        <!-- Source URL -->
        <div class="text-sm text-on-surface-variant flex flex-col gap-2 w-full text-center" data-testid="source-url">
          <div class="flex justify-evenly items-center">
            <span class="font-medium w-12">From:</span> 
            <span class="text-center">{{ sourceUrl? sourceUrl : 'https://auth.mirrorstack.ai' }}</span>
          </div>
          <div class="flex justify-evenly items-center">
            <span class="font-medium w-12">To:</span> 
            <span class="text-center">{{ destinationUrl? destinationUrl : 'https://work.mirrorstack.ai'}}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="w-full max-w-md space-y-3">
          <!-- Authorize Button -->
          <button
            class="w-full h-12 px-6 bg-primary text-on-primary rounded-2xl transition-all duration-300 hover:bg-primary-container hover:text-on-primary-container hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] group"
            data-testid="authorize-button"
            @click="handleAuthorize"
            :disabled="isProcessing"
          >
            <div class="flex items-center justify-center gap-3">
              <span v-if="isProcessing" class="animate-spin material-symbols-rounded text-xl w-6 text-center">sync</span>
              <span v-else class="material-symbols-rounded text-xl w-6 text-center">check</span>
              <span class="text-lg font-medium w-32 text-center">
                {{ isProcessing ? 'Authorizing...' : 'Authorize' }}
              </span>
            </div>
          </button>

          <!-- Cancel Button -->
          <button
            class="w-full h-12 px-6 border-2 border-outline text-on-surface rounded-2xl transition-all duration-300 hover:bg-surface-variant hover:text-on-surface-variant hover:scale-[1.02] hover:shadow-lg hover:shadow-outline/25 active:scale-[0.98] group"
            data-testid="cancel-button"
            @click="handleCancel"
            :disabled="isProcessing"
          >
            <div class="flex items-center justify-center gap-3">
              <span class="material-symbols-rounded text-xl w-6 text-center">close</span>
              <span class="text-lg font-medium w-32">Cancel</span>
            </div>
          </button>
        </div>

        <!-- Timeout Display -->
        <div class="w-full max-w-md">
          <div class="p-3 bg-surface-variant rounded-lg text-sm text-on-surface-variant">
            <span class="font-medium">Timeout: </span> 
            <span v-if="isInitializing" class="text-on-surface-variant">Calculating...</span>
            <span v-else>{{ timeLeft }} seconds</span>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="w-full max-w-md">
          <div class="p-4 bg-red-100 text-red-800 rounded-lg text-sm" data-testid="error-message">
            {{ errorMessage }}
          </div>
        </div>

        <!-- Theme Toggle -->
        <div class="absolute top-4 right-4">
          <ThemeToggle />
        </div>
      </div>
    </ContainerMain>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ContainerMain from '@/components/ContainerMain.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AuthenticationService from '@/services/AuthenticationService'
import TimeoutService from '@/services/TimeoutService'
import ExtensionCommunicationService from '@/services/ExtensionCommunicationService'

// Props
interface Props {
  sourceUrl?: string
  destinationUrl?: string
  requestId?: string
}

const props = withDefaults(defineProps<Props>(), {
  sourceUrl: 'https://auth.mirrorstack.ai',
  destinationUrl: 'https://work.mirrorstack.ai',
  requestId: 'unknown'
})

// Emits
const emit = defineEmits<{
  'authorize-success': [requestId: string]
  'authorize-error': [error: string]
  'cancel': []
  'navigate-to-security-check': []
  'navigate-to-main': []
  'navigate-to-behavior': [requestId: string]
  'navigate-to-authentication-failed': [error: string]
}>()

// Services
const authService = AuthenticationService.getInstance()
const timeoutService = TimeoutService.getInstance()
const extensionService = ExtensionCommunicationService.getInstance()

// Reactive state
const isProcessing = ref(false)
const errorMessage = ref('')
const timeLeft = ref(0) // Will be calculated properly
const startTime = ref<number>(0) // Track when authentication started
const isInitializing = ref(true) // Track initialization state

// Get start time from authentication request
const getStartTimeFromRequest = async () => {
  try {
    const pendingRequest = await authService.getPendingAuthenticationRequest()
    
    if (pendingRequest && pendingRequest.startTime) {
      console.log('AuthenticationView: Found start time from request:', pendingRequest.startTime)
      return pendingRequest.startTime
    }
  } catch (error) {
    console.error('AuthenticationView: Failed to get start time from request:', error)
  }
  
  // Fallback to current time if not found
  console.log('AuthenticationView: Using current time as fallback')
  return Date.now()
}

// Methods
const clearAuthenticationStatus = async (requestId: string, status: 'completed' | 'cancelled' | 'timeout') => {
  try {
    await authService.clearAuthenticationStatus(requestId, status)
    console.log(`AuthenticationView: Cleared authentication status for ${status}`)
  } catch (error) {
    console.error('AuthenticationView: Failed to clear authentication status:', error)
  }
}

const startTimeout = async () => {
  try {
    const timeoutId = `auth_${props.requestId}`
    
    await timeoutService.startTimeout(
      timeoutId,
      startTime.value,
      {
        onTimeout: handleTimeout,
        onTick: (remainingTime: number) => {
          timeLeft.value = remainingTime
        }
      }
    )
    
    console.log('AuthenticationView: Started timeout for request:', props.requestId)
  } catch (error) {
    console.error('AuthenticationView: Failed to start timeout:', error)
    handleTimeout()
  }
}

const handleTimeout = () => {
  const timeoutId = `auth_${props.requestId}`
  timeoutService.clearTimeout(timeoutId)
  
  console.log('AuthenticationView: Authentication timeout')
  clearAuthenticationStatus(props.requestId, 'timeout')
  
  // Send status update to background script for web page
  try {
    extensionService.sendMessage({
      type: 'AUTHENTICATION_TIMEOUT',
      requestId: props.requestId
    })
    console.log('AuthenticationView: Sent timeout status to background script')
  } catch (error) {
    console.error('AuthenticationView: Failed to send timeout status to background:', error)
  }
  
  // Dispatch authentication status update event
  window.dispatchEvent(new CustomEvent('MirrorStackWalletAuthUpdate', {
    detail: {
      status: 'timeout',
      requestId: props.requestId
    }
  }))
  
  emit('cancel')
  emit('navigate-to-authentication-failed', 'Authentication timed out')
}

const handleAuthorize = async () => {
  try {
    isProcessing.value = true
    errorMessage.value = ''
    
    // Clear timeout
    const timeoutId = `auth_${props.requestId}`
    timeoutService.clearTimeout(timeoutId)
    
    // Simulate authentication process
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Emit success event to navigate to behavior view
    emit('authorize-success', props.requestId)
    emit('navigate-to-behavior', props.requestId)
    
    console.log('AuthenticationView: Authorization successful for request', props.requestId)
  } catch (error) {
    console.error('AuthenticationView: Authorization failed:', error)
    errorMessage.value = 'Authorization failed. Please try again.'
    emit('authorize-error', error instanceof Error ? error.message : 'Unknown error')
    emit('navigate-to-authentication-failed', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    isProcessing.value = false
  }
}

const handleCancel = async () => {
  console.log('AuthenticationView: Authentication cancelled')
  
  // Clear timeout
  const timeoutId = `auth_${props.requestId}`
  timeoutService.clearTimeout(timeoutId)
  
  // Clear authentication status
  await clearAuthenticationStatus(props.requestId, 'cancelled')
  
  // Dispatch authentication status update event
  window.dispatchEvent(new CustomEvent('MirrorStackWalletAuthUpdate', {
    detail: {
      status: 'cancelled',
      requestId: props.requestId
    }
  }))
  
  emit('cancel')
  emit('navigate-to-authentication-failed', 'Authentication was cancelled by user')
}

// Initialize
onMounted(async () => {
  console.log('AuthenticationView: Component mounted with props:', {
    sourceUrl: props.sourceUrl,
    destinationUrl: props.destinationUrl,
    requestId: props.requestId
  })
  
  // Get start time from request
  startTime.value = await getStartTimeFromRequest()
  
  // Calculate initial remaining time
  try {
    const initialRemainingTime = await timeoutService.calculateRemainingTime(startTime.value)
    timeLeft.value = initialRemainingTime
  } catch (error) {
    console.error('AuthenticationView: Failed to calculate initial remaining time:', error)
    // Fallback to default timeout
    timeLeft.value = 45
  }
  
  // Start timeout
  await startTimeout()
  
  // Mark initialization as complete
  isInitializing.value = false
  
  // Set up popup close detection
  const handleBeforeUnload = () => {
    console.log('AuthenticationView: Popup closing, sending timeout status')
    handleTimeout()
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // Store the handler for cleanup
  ;(window as any).__authenticationViewBeforeUnload = handleBeforeUnload
})

onUnmounted(() => {
  // Clear timeout on unmount
  const timeoutId = `auth_${props.requestId}`
  timeoutService.clearTimeout(timeoutId)
  
  // Clean up popup close listener
  if ((window as any).__authenticationViewBeforeUnload) {
    window.removeEventListener('beforeunload', (window as any).__authenticationViewBeforeUnload)
  }
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style> 