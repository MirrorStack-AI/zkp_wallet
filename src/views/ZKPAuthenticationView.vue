<template>
  <div class="relative w-full h-full bg-surface" data-testid="zkp-authentication-view">
    <ContainerMain>
      <div class="flex flex-col items-center justify-center gap-4 text-center">
        <!-- Progress Activity Icon -->
        <div class="w-24 h-24 flex items-center justify-center" data-testid="progress-activity">
          <div class="w-full h-full relative">
            <!-- Animated loading spinner -->
            <div class="absolute inset-0 animate-spin">
              <svg class="w-full h-full" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="48" cy="48" r="44" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="276" stroke-dashoffset="276" class="text-primary animate-pulse">
                  <animate attributeName="stroke-dashoffset" values="276;0;276" dur="2s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            <!-- ZKP icon in center -->
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="material-symbols-rounded text-primary text-4xl" style="font-size: 48px">security</span>
            </div>
          </div>
        </div>

        <!-- Title -->
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-on-surface">
            <span class="security-text" data-testid="zkp-title">ZKP Authentication</span>
          </h1>
        </div>

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

        <p class="text-sm text-on-surface-variant" data-testid="zkp-subtitle">
            Processing zero-knowledge proof verification
        </p>

        <!-- Error Message -->
        <div v-if="errorMessage" class="w-full max-w-md">
          <div class="p-4 bg-error-container text-on-error-container rounded-lg text-sm text-center" data-testid="error-message">
            {{ errorMessage }}
          </div>
        </div>

        <!-- Retry Button (shown on error) -->
        <div v-if="errorMessage" class="w-full max-w-md">
          <button
            class="w-full h-12 px-6 bg-primary text-on-primary rounded-2xl transition-all duration-300 hover:bg-primary-container hover:text-on-primary-container hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] group"
            data-testid="retry-button"
            @click="handleRetry"
            :disabled="isProcessing"
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
import { ref, onMounted, onUnmounted } from 'vue'
import ContainerMain from '@/components/ContainerMain.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

// Props
interface Props {
  requestId?: string
  signature?: string
  sourceUrl?: string
  destinationUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  requestId: 'unknown',
  signature: '',
  sourceUrl: 'https://auth.mirrorstack.ai',
  destinationUrl: 'https://work.mirrorstack.ai'
})

// Emits
const emit = defineEmits<{
  'zkp-success': [requestId: string]
  'zkp-error': [error: string]
  'cancel': []
  'navigate-to-main': []
  'navigate-to-behavior': []
}>()

// Reactive state
const isProcessing = ref(false)
const errorMessage = ref('')
const isAuthenticating = ref(false)

// Methods
const startZKPAuth = async () => {
  try {
    isProcessing.value = true
    errorMessage.value = ''

    // Simulate ZKP authentication process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Emit success event
    emit('zkp-success', props.requestId)
    
    console.log('ZKPAuthenticationView: ZKP authentication successful for request', props.requestId)
  } catch (error) {
    console.error('ZKPAuthenticationView: ZKP authentication failed:', error)
    errorMessage.value = 'ZKP authentication failed. Please try again.'
    emit('zkp-error', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    isProcessing.value = false
  }
}

const handleRetry = async () => {
  errorMessage.value = ''
  await startZKPAuth()
}

// Lifecycle
onMounted(() => {
  console.log('ZKPAuthenticationView: Mounted with props:', {
    requestId: props.requestId,
    signature: props.signature ? 'provided' : 'not provided'
  })
  
  // Start ZKP authentication automatically
  startZKPAuth()
})

onUnmounted(() => {
  // Clean up any resources if needed
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style> 