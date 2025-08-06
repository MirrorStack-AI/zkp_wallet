<template>
  <div class="relative w-full h-full bg-[#f6fafe]" data-testid="authentication-failed-view">
    <ContainerMain>
      <div class="flex flex-col items-center justify-center gap-4 text-center">
        <!-- Warning Icon -->
        <div class="w-16 h-16 w-full flex items-center justify-center" data-testid="encrypted-icon">
          <span class="material-symbols-rounded text-error" style="font-size: 48px">warning</span>
        </div>

        <!-- Title -->
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-on-surface">
            <span class="text-error" data-testid="failed-title">Authentication Failed</span>
          </h1>
        </div>

        <!-- Error Message -->
        <div class="w-full max-w-md">
          <div class="p-4 text-error text-sm text-center" data-testid="error-message">
            Error: {{ errorMessage || 'AKLFSAJLKFJSFJQ), need help?' }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="w-full flex px-4">
          <!-- Close Button -->
          <button
            class="w-full h-12 px-6 bg-error text-on-error rounded-2xl transition-all duration-300 hover:bg-error-container hover:text-on-error-container hover:scale-[1.02] hover:shadow-lg hover:shadow-error/25 active:scale-[0.98] group"
            data-testid="close-button"
            @click="handleClose"
          >
            <div class="flex items-center justify-center gap-3">
              <span class="material-symbols-rounded text-xl w-6 text-center">close</span>
              <span class="text-lg font-medium w-32 text-center">Close</span>
            </div>
          </button>

          <!-- Retry Button (Optional) -->
          <button
            v-if="showRetryButton"
            class="w-full h-12 px-6 border-2 border-outline text-on-surface rounded-2xl transition-all duration-300 hover:bg-surface-variant hover:text-on-surface-variant hover:scale-[1.02] hover:shadow-lg hover:shadow-outline/25 active:scale-[0.98] group"
            data-testid="retry-button"
            @click="handleRetry"
          >
            <div class="flex items-center justify-center gap-3">
              <span class="material-symbols-rounded text-xl w-6 text-center">refresh</span>
              <span class="text-lg font-medium w-32 text-center">Retry</span>
            </div>
          </button>
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
import { ref, onMounted } from 'vue'
import ContainerMain from '@/components/ContainerMain.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AuthenticationService from '@/services/AuthenticationService'
import ExtensionCommunicationService from '@/services/ExtensionCommunicationService'

// Props
interface Props {
  errorMessage?: string
  requestId?: string
  showRetryButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  errorMessage: 'Authentication failed. Please try again.',
  showRetryButton: false
})

// Emits
const emit = defineEmits<{
  'close': []
  'retry': []
  'navigate-to-welcome': []
}>()

// Reactive data
const isProcessing = ref(false)

// Methods
const handleClose = async () => {
  try {
    isProcessing.value = true
    
    // Clear any pending authentication request
    if (props.requestId) {
      const authService = AuthenticationService.getInstance()
      await authService.clearAuthenticationStatus(props.requestId, 'cancelled')
    }

    // Send status update to extension
    const extensionService = ExtensionCommunicationService.getInstance()
    await extensionService.sendMessage({
      type: 'AUTHENTICATION_FAILED',
      data: {
        requestId: props.requestId,
        error: props.errorMessage
      }
    })

    // Emit events for navigation
    emit('close')
    emit('navigate-to-welcome')

    // Close the extension window
    if ((window.chrome as any)?.windows?.getCurrent) {
      try {
        const currentWindow = await (window.chrome as any).windows.getCurrent()
        await (window.chrome as any).windows.update(currentWindow.id, { focused: false })
        window.close()
      } catch (error) {
        console.error('AuthenticationFailedView: Failed to close extension window:', error)
        // Fallback: try to close the window directly
        window.close()
      }
    } else {
      // Fallback: close the window directly
      window.close()
    }
  } catch (error) {
    console.error('AuthenticationFailedView: Error handling close:', error)
    // Fallback: try to close the window anyway
    window.close()
  } finally {
    isProcessing.value = false
  }
}

const handleRetry = async () => {
  try {
    isProcessing.value = true
    
    // Clear the failed request
    if (props.requestId) {
      const authService = AuthenticationService.getInstance()
      await authService.clearAuthenticationStatus(props.requestId, 'cancelled')
    }

    // Emit retry event to navigate back to authentication
    emit('retry')
  } catch (error) {
    console.error('AuthenticationFailedView: Error handling retry:', error)
  } finally {
    isProcessing.value = false
  }
}

// Lifecycle
onMounted(() => {
  console.log('AuthenticationFailedView: Mounted with error:', props.errorMessage)
})
</script>

<style scoped>
</style> 