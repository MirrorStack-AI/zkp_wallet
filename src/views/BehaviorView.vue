<template>
  <div class="relative w-full h-full bg-[#f8fafe]" data-testid="behavior-view">
    <ContainerMain>
      <div class="flex flex-col items-center justify-center gap-3 text-center p-6">
        <!-- Title -->
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-on-surface">
            <span class="security-text" data-testid="behavior-title">Sign This Number</span>
          </h1>
          <p class="text-sm text-on-surface-variant" data-testid="behavior-subtitle">
            Please sign the number below <br/>to verify you are human
          </p>
        </div>

        <!-- Number Display -->
        <div class="w-full">
          <div class="text-3xl font-bold text-on-surface-variant" data-testid="number-display">
            {{ numberToSign }}
          </div>
        </div>

        <!-- Signature Canvas -->
        <div class="w-full h-40 bg-inverse-surface rounded-[20px] relative overflow-hidden" data-testid="signature-canvas">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-sm text-on-surface-variant text-center p-4">
              <p class="text-left mt-2 text-surface">Draw your unique number here...</p>
            </div>
          </div>
          <!-- Canvas will be added here for signature functionality -->
          <canvas
            ref="signatureCanvas"
            class="absolute inset-0 w-full h-full cursor-crosshair"
            data-testid="signature-canvas-element"
          ></canvas>
        </div>

        <!-- Action Buttons -->
        <div class="w-full max-w-md space-y-2">
          <!-- Next Button -->
          <button
            class="w-full h-12 px-6 bg-primary text-on-primary rounded-2xl transition-all duration-300 hover:bg-primary-container hover:text-on-primary-container hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] group"
            data-testid="next-button"
            @click="handleNext"
            :disabled="isProcessing || !hasSignature"
          >
            <div class="flex items-center justify-center gap-3">
              <span v-if="isProcessing" class="animate-spin material-symbols-rounded text-xl w-6 text-center">sync</span>
              <span v-else class="material-symbols-rounded text-xl w-6 text-center">arrow_forward</span>
              <span class="text-lg font-medium w-32 text-center">
                {{ isProcessing ? 'Verifying' : 'Next' }}
              </span>
            </div>
          </button>

          <!-- Clear Button -->
          <button
            class="w-full h-12 px-6 border-2 border-outline text-on-surface rounded-2xl transition-all duration-300 hover:bg-surface-variant hover:text-on-surface-variant hover:scale-[1.02] hover:shadow-lg hover:shadow-outline/25 active:scale-[0.98] group"
            data-testid="clear-button"
            @click="handleClear"
            :disabled="isProcessing"
          >
            <div class="flex items-center justify-center gap-3">
              <span class="material-symbols-rounded text-xl w-6 text-center">clear</span>
              <span class="text-lg font-medium w-32 text-center">Clear</span>
            </div>
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="w-full max-w-md">
          <div class="p-4 text-error text-sm text-center" data-testid="error-message">
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

// Props
interface Props {
  requestId?: string
  numberToSign?: string
  sourceUrl?: string
  destinationUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  requestId: 'unknown',
  numberToSign: '187',
  sourceUrl: 'https://auth.mirrorstack.ai',
  destinationUrl: 'https://work.mirrorstack.ai'
})

// Emits
const emit = defineEmits<{
  'behavior-success': [requestId: string, signature: string]
  'behavior-error': [error: string]
  'cancel': []
  'navigate-to-main': []
  'navigate-to-authentication': []
  'navigate-to-biometric': [requestId: string, signature: string, sourceUrl: string, destinationUrl: string]
}>()

// Reactive state
const isProcessing = ref(false)
const errorMessage = ref('')
const hasSignature = ref(false)
const signatureCanvas = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

// Methods
const initCanvas = () => {
  if (!signatureCanvas.value) return
  
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Set canvas size
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
  
  // Set drawing style
  ctx.strokeStyle = '#236488'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const startDrawing = (e: MouseEvent | TouchEvent) => {
  isDrawing.value = true
  const rect = signatureCanvas.value?.getBoundingClientRect()
  if (!rect) return
  
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  
  lastX.value = clientX - rect.left
  lastY.value = clientY - rect.top
}

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value || !signatureCanvas.value) return
  
  const ctx = signatureCanvas.value.getContext('2d')
  if (!ctx) return
  
  const rect = signatureCanvas.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  
  const currentX = clientX - rect.left
  const currentY = clientY - rect.top
  
  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(currentX, currentY)
  ctx.stroke()
  
  lastX.value = currentX
  lastY.value = currentY
  
  hasSignature.value = true
}

const stopDrawing = () => {
  isDrawing.value = false
}

const clearCanvas = () => {
  if (!signatureCanvas.value) return
  
  const ctx = signatureCanvas.value.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, signatureCanvas.value.width, signatureCanvas.value.height)
  hasSignature.value = false
}

const getSignatureData = (): string => {
  if (!signatureCanvas.value) return ''
  
  return signatureCanvas.value.toDataURL('image/png')
}

const handleNext = async () => {
  try {
    isProcessing.value = true
    errorMessage.value = ''
    
    if (!hasSignature.value) {
      errorMessage.value = 'Please sign the number before continuing'
      isProcessing.value = false
      return
    }
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const signatureData = getSignatureData()
    
    // Emit success event
    emit('behavior-success', props.requestId, signatureData)
    emit('navigate-to-biometric', props.requestId, signatureData, props.sourceUrl, props.destinationUrl)
    
    console.log('BehaviorView: Behavioral verification successful for request', props.requestId)
  } catch (error) {
    console.error('BehaviorView: Behavioral verification failed:', error)
    errorMessage.value = 'Verification failed. Please try again.'
    emit('behavior-error', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    isProcessing.value = false
  }
}

const handleClear = () => {
  clearCanvas()
  errorMessage.value = ''
}

// Lifecycle
onMounted(() => {
  console.log('BehaviorView: Mounted with props:', {
    requestId: props.requestId,
    numberToSign: props.numberToSign
  })
  
  // Initialize canvas
  initCanvas()
  
  // Add event listeners
  if (signatureCanvas.value) {
    signatureCanvas.value.addEventListener('mousedown', startDrawing)
    signatureCanvas.value.addEventListener('mousemove', draw)
    signatureCanvas.value.addEventListener('mouseup', stopDrawing)
    signatureCanvas.value.addEventListener('mouseout', stopDrawing)
    
    // Touch events for mobile
    signatureCanvas.value.addEventListener('touchstart', startDrawing)
    signatureCanvas.value.addEventListener('touchmove', draw)
    signatureCanvas.value.addEventListener('touchend', stopDrawing)
  }
})

onUnmounted(() => {
  // Remove event listeners
  if (signatureCanvas.value) {
    signatureCanvas.value.removeEventListener('mousedown', startDrawing)
    signatureCanvas.value.removeEventListener('mousemove', draw)
    signatureCanvas.value.removeEventListener('mouseup', stopDrawing)
    signatureCanvas.value.removeEventListener('mouseout', stopDrawing)
    
    signatureCanvas.value.removeEventListener('touchstart', startDrawing)
    signatureCanvas.value.removeEventListener('touchmove', draw)
    signatureCanvas.value.removeEventListener('touchend', stopDrawing)
  }
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style> 