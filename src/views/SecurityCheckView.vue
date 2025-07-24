<template>
  <div class="relative w-full h-full" data-testid="security-check-view">
    <ContainerMain>
      <div class="flex flex-col items-center justify-center gap-2 text-center">
        <IconLogo class="w-16 h-16 text-primary" data-testid="logo" />

        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-on-surface">
            <span class="security-text" data-testid="security-checking-title"
              >Security Checking</span
            ><span class="animate-ellipsis" data-testid="security-checking-dots">
              <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
          </h1>
          <p class="text-sm text-on-surface-variant">Verifying your device for enhanced security</p>
        </div>

        <div class="w-full pt-2">
          <ProgressIndicator
            :progress="securityState.progress"
            label="Security Check"
            :description="getCurrentStepDescription()"
            :show-label="false"
            data-testid="progress-indicator"
          />
        </div>

        <!-- Real-time Security Status Indicators -->
        <div class="w-full" data-testid="security-steps">
          <div class="text-xs text-on-surface-variant flex flex-col" data-testid="security-status">
            <!-- Security Check Steps -->
            <div
              v-for="step in securitySteps"
              :key="step.key"
              class="flex items-center justify-between transition-all duration-500"
              :data-testid="`security-step`"
              :data-check="step.key"
            >
              <span>{{ step.label }}:</span>
              <span class="flex items-center gap-1">
                <!-- Show "..." when step not completed yet -->
                <span v-if="getStepStatus(step.enum) === null" class="text-on-surface-variant"
                  >...</span
                >

                <!-- Show status when step is completed -->
                <template v-else>
                  <span v-if="getStepStatus(step.enum)" class="text-green-500">✓</span>
                  <span v-else class="text-error">✗</span>
                  <span v-if="getStepStatus(step.enum)" class="text-green-500 text-xs">
                    {{ step.successText }}
                  </span>
                  <span v-else class="text-error text-xs">{{ step.failureText }}</span>
                </template>
              </span>
            </div>
          </div>
        </div>

        <!-- CSRF Token (hidden for security) -->
        <input type="hidden" data-testid="csrf-token" :value="csrfToken" />

        <!-- Security Headers Info -->
        <div class="security-headers hidden" data-testid="security-headers">
          <div class="header-item" data-testid="x-frame-options">X-Frame-Options: DENY</div>
          <div class="header-item" data-testid="x-content-type-options">
            X-Content-Type-Options: nosniff
          </div>
          <div class="header-item" data-testid="x-xss-protection">
            X-XSS-Protection: 1; mode=block
          </div>
          <div class="header-item" data-testid="content-security-policy">
            Content-Security-Policy: frame-ancestors 'none'
          </div>
        </div>

        <div
          v-if="securityCheckComplete"
          data-testid="security-check-complete"
          class="hidden"
        ></div>
        <div v-if="securityError" data-testid="security-error" class="hidden"></div>
        <button v-if="showRetryButton" data-testid="retry-security-check" class="hidden">
          Retry
        </button>

        <p v-if="showTroubleshooting" class="text-sm text-error italic underline">
          Troubleshooting?
        </p>
      </div>
    </ContainerMain>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import ContainerMain from '@/components/ContainerMain.vue'
import IconLogo from '@/components/icons/IconLogo.vue'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import { SecurityCheckService } from '@/services/security-check'
import { SecurityCheckStep } from '@/services/security-check/types'

const TROUBLESHOOTING_DELAY = 15000 // 15 seconds
const STATE_UPDATE_INTERVAL = 50 // 50ms

// Configuration constants
const SECURITY_CHECK_CONFIG = {
  enableHSM: true,
  enableBiometric: true,
  enableDeviceFingerprinting: true,
  enableZKP: true,
  enableCSP: true,
  enableTLS: true,
  enableHeaders: true,
  enableCrypto: true,
  enableStorage: true,
  enableDOMProtection: true,
  timeoutMs: 30000,
  retryAttempts: 3,
  delayMs: STATE_UPDATE_INTERVAL, // Overall delay for all security checks
} as const

// Initialize security check service
const securityService = new SecurityCheckService(SECURITY_CHECK_CONFIG)

// CSRF Token for security
const csrfToken = ref(generateCSRFToken())

function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// Reactive state
const securityState = ref(securityService.getState())

// Security steps configuration - memoized to prevent unnecessary recalculations
const securitySteps = computed(() => [
  {
    key: 'device-fingerprint',
    enum: SecurityCheckStep.DEVICE_FINGERPRINTING,
    label: 'Device Fingerprint',
    successText: 'Secure',
    failureText: 'Failed',
  },
  {
    key: 'hsm-status',
    enum: SecurityCheckStep.HSM_VERIFICATION,
    label: 'HSM Status',
    successText: 'Available',
    failureText: 'Unavailable',
  },
  {
    key: 'biometric',
    enum: SecurityCheckStep.BIOMETRIC_CHECK,
    label: 'Biometric',
    successText: 'Supported',
    failureText: 'Not Supported',
  },
  {
    key: 'zkp-ready',
    enum: SecurityCheckStep.ZKP_INITIALIZATION,
    label: 'ZKP Ready',
    successText: 'Ready',
    failureText: 'Failed',
  },
  {
    key: 'csp-policy',
    enum: SecurityCheckStep.CSP_VALIDATION,
    label: 'CSP Policy',
    successText: 'Secure',
    failureText: 'Insecure',
  },
  {
    key: 'tls-https',
    enum: SecurityCheckStep.TLS_CHECK,
    label: 'TLS/HTTPS',
    successText: 'Secure',
    failureText: 'Insecure',
  },
  {
    key: 'security-headers',
    enum: SecurityCheckStep.HEADERS_CHECK,
    label: 'Security Headers',
    successText: 'Configured',
    failureText: 'Missing',
  },
  {
    key: 'crypto-api',
    enum: SecurityCheckStep.CRYPTO_CHECK,
    label: 'Crypto API',
    successText: 'Available',
    failureText: 'Unavailable',
  },
  {
    key: 'secure-storage',
    enum: SecurityCheckStep.STORAGE_CHECK,
    label: 'Secure Storage',
    successText: 'Available',
    failureText: 'Unavailable',
  },
  {
    key: 'dom-protection',
    enum: SecurityCheckStep.DOM_PROTECTION,
    label: 'DOM Protection',
    successText: 'Protected',
    failureText: 'Vulnerable',
  },
])

// Track completed steps and their results
const completedSteps = ref(new Set<SecurityCheckStep>())
const stepResults = ref(new Map<SecurityCheckStep, boolean>())

// Show troubleshooting after delay
const showTroubleshooting = ref(false)

// Interval references for cleanup
let checkInterval: number | undefined
let troubleshootingTimeout: number | undefined

// Start security check on mount
onMounted(async () => {
  try {
    // Start troubleshooting timer
    troubleshootingTimeout = window.setTimeout(() => {
      showTroubleshooting.value = true
    }, TROUBLESHOOTING_DELAY)

    // Start actual security check and continuously update step display
    checkInterval = window.setInterval(() => {
      securityState.value = securityService.getState()
      updateStepDisplayFromState()

      // Stop checking when security check is complete
      if (
        securityState.value.currentStep === SecurityCheckStep.COMPLETED ||
        securityState.value.currentStep === SecurityCheckStep.ERROR
      ) {
        cleanupIntervals()
      }
    }, STATE_UPDATE_INTERVAL)

    // Start actual security check
    await securityService.startSecurityCheck()
    securityState.value = securityService.getState()
    updateStepDisplayFromState()
  } catch (error) {
    console.error('Security check failed:', error)
    // Ensure cleanup happens even on error
    cleanupIntervals()
  }
})

// Cleanup function to prevent memory leaks
const cleanupIntervals = () => {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = undefined
  }
  if (troubleshootingTimeout) {
    clearTimeout(troubleshootingTimeout)
    troubleshootingTimeout = undefined
  }
}

// Cleanup on component unmount
onUnmounted(() => {
  cleanupIntervals()
})

// Update step display based on actual security check state
const updateStepDisplayFromState = () => {
  // Track when steps are actually completed by monitoring state changes
  // Only mark as completed when the step has moved past the current step

  const currentStep = securityState.value.currentStep

  // Device fingerprint is completed when it has a value and we've moved past it
  if (
    securityState.value.deviceFingerprint !== null &&
    currentStep !== SecurityCheckStep.DEVICE_FINGERPRINTING
  ) {
    completedSteps.value.add(SecurityCheckStep.DEVICE_FINGERPRINTING)
    stepResults.value.set(
      SecurityCheckStep.DEVICE_FINGERPRINTING,
      !!securityState.value.deviceFingerprint,
    )
  }

  // HSM is completed when we've moved past it
  if (
    currentStep !== SecurityCheckStep.HSM_VERIFICATION &&
    currentStep !== SecurityCheckStep.DEVICE_FINGERPRINTING
  ) {
    completedSteps.value.add(SecurityCheckStep.HSM_VERIFICATION)
    stepResults.value.set(
      SecurityCheckStep.HSM_VERIFICATION,
      securityState.value.hsmStatus?.isAvailable || false,
    )
  }

  // Biometric is completed when we've moved past it
  if (
    currentStep !== SecurityCheckStep.BIOMETRIC_CHECK &&
    currentStep !== SecurityCheckStep.DEVICE_FINGERPRINTING &&
    currentStep !== SecurityCheckStep.HSM_VERIFICATION
  ) {
    completedSteps.value.add(SecurityCheckStep.BIOMETRIC_CHECK)
    stepResults.value.set(
      SecurityCheckStep.BIOMETRIC_CHECK,
      securityState.value.biometricStatus?.isSupported || false,
    )
  }

  // ZKP is completed when we've moved past it
  if (
    currentStep !== SecurityCheckStep.ZKP_INITIALIZATION &&
    currentStep !== SecurityCheckStep.DEVICE_FINGERPRINTING &&
    currentStep !== SecurityCheckStep.HSM_VERIFICATION &&
    currentStep !== SecurityCheckStep.BIOMETRIC_CHECK
  ) {
    completedSteps.value.add(SecurityCheckStep.ZKP_INITIALIZATION)
    stepResults.value.set(
      SecurityCheckStep.ZKP_INITIALIZATION,
      securityState.value.zkpStatus?.isReady || false,
    )
  }

  // CSP is completed when we've moved past it
  if (
    currentStep !== SecurityCheckStep.CSP_VALIDATION &&
    currentStep !== SecurityCheckStep.DEVICE_FINGERPRINTING &&
    currentStep !== SecurityCheckStep.HSM_VERIFICATION &&
    currentStep !== SecurityCheckStep.BIOMETRIC_CHECK &&
    currentStep !== SecurityCheckStep.ZKP_INITIALIZATION
  ) {
    completedSteps.value.add(SecurityCheckStep.CSP_VALIDATION)
    stepResults.value.set(
      SecurityCheckStep.CSP_VALIDATION,
      securityState.value.cspStatus?.isEnabled || false,
    )
  }

  // TLS is completed when we've moved past it
  if (
    currentStep !== SecurityCheckStep.TLS_CHECK &&
    currentStep !== SecurityCheckStep.DEVICE_FINGERPRINTING &&
    currentStep !== SecurityCheckStep.HSM_VERIFICATION &&
    currentStep !== SecurityCheckStep.BIOMETRIC_CHECK &&
    currentStep !== SecurityCheckStep.ZKP_INITIALIZATION &&
    currentStep !== SecurityCheckStep.CSP_VALIDATION
  ) {
    completedSteps.value.add(SecurityCheckStep.TLS_CHECK)
    stepResults.value.set(
      SecurityCheckStep.TLS_CHECK,
      securityState.value.tlsStatus?.isSecure || false,
    )
  }

  // Headers is completed when we've moved past it
  if (
    currentStep !== SecurityCheckStep.HEADERS_CHECK &&
    currentStep !== SecurityCheckStep.DEVICE_FINGERPRINTING &&
    currentStep !== SecurityCheckStep.HSM_VERIFICATION &&
    currentStep !== SecurityCheckStep.BIOMETRIC_CHECK &&
    currentStep !== SecurityCheckStep.ZKP_INITIALIZATION &&
    currentStep !== SecurityCheckStep.CSP_VALIDATION &&
    currentStep !== SecurityCheckStep.TLS_CHECK
  ) {
    completedSteps.value.add(SecurityCheckStep.HEADERS_CHECK)
    stepResults.value.set(
      SecurityCheckStep.HEADERS_CHECK,
      securityState.value.headersStatus?.hasXFrameOptions || false,
    )
  }

  // Crypto is completed when we've moved past it
  if (
    currentStep !== SecurityCheckStep.CRYPTO_CHECK &&
    currentStep !== SecurityCheckStep.DEVICE_FINGERPRINTING &&
    currentStep !== SecurityCheckStep.HSM_VERIFICATION &&
    currentStep !== SecurityCheckStep.BIOMETRIC_CHECK &&
    currentStep !== SecurityCheckStep.ZKP_INITIALIZATION &&
    currentStep !== SecurityCheckStep.CSP_VALIDATION &&
    currentStep !== SecurityCheckStep.TLS_CHECK &&
    currentStep !== SecurityCheckStep.HEADERS_CHECK
  ) {
    completedSteps.value.add(SecurityCheckStep.CRYPTO_CHECK)
    stepResults.value.set(
      SecurityCheckStep.CRYPTO_CHECK,
      securityState.value.cryptoStatus?.hasSubtleCrypto || false,
    )
  }

  // Storage is completed when we've moved past it
  if (
    currentStep !== SecurityCheckStep.STORAGE_CHECK &&
    currentStep !== SecurityCheckStep.DEVICE_FINGERPRINTING &&
    currentStep !== SecurityCheckStep.HSM_VERIFICATION &&
    currentStep !== SecurityCheckStep.BIOMETRIC_CHECK &&
    currentStep !== SecurityCheckStep.ZKP_INITIALIZATION &&
    currentStep !== SecurityCheckStep.CSP_VALIDATION &&
    currentStep !== SecurityCheckStep.TLS_CHECK &&
    currentStep !== SecurityCheckStep.HEADERS_CHECK &&
    currentStep !== SecurityCheckStep.CRYPTO_CHECK
  ) {
    completedSteps.value.add(SecurityCheckStep.STORAGE_CHECK)
    stepResults.value.set(
      SecurityCheckStep.STORAGE_CHECK,
      securityState.value.storageStatus?.hasSecureStorage || false,
    )
  }

  // DOM Protection is completed when we've moved past it
  if (
    currentStep !== SecurityCheckStep.DOM_PROTECTION &&
    currentStep !== SecurityCheckStep.DEVICE_FINGERPRINTING &&
    currentStep !== SecurityCheckStep.HSM_VERIFICATION &&
    currentStep !== SecurityCheckStep.BIOMETRIC_CHECK &&
    currentStep !== SecurityCheckStep.ZKP_INITIALIZATION &&
    currentStep !== SecurityCheckStep.CSP_VALIDATION &&
    currentStep !== SecurityCheckStep.TLS_CHECK &&
    currentStep !== SecurityCheckStep.HEADERS_CHECK &&
    currentStep !== SecurityCheckStep.CRYPTO_CHECK &&
    currentStep !== SecurityCheckStep.STORAGE_CHECK
  ) {
    completedSteps.value.add(SecurityCheckStep.DOM_PROTECTION)
    stepResults.value.set(
      SecurityCheckStep.DOM_PROTECTION,
      securityState.value.domSkimmingStatus?.isProtected || false,
    )
  }
}

// Helper functions
const getCurrentStepDescription = (): string => {
  const step = securityState.value.currentStep

  switch (step) {
    case 'initializing':
      return 'Initializing security systems...'
    case 'device_fingerprinting':
      return 'Verifying device fingerprint and HSM...'
    case 'hsm_verification':
      return 'Checking hardware security module...'
    case 'biometric_check':
      return 'Verifying biometric authentication...'
    case 'zkp_initialization':
      return 'Initializing zero-knowledge proofs...'
    case 'csp_validation':
      return 'Validating content security policy...'
    case 'tls_check':
      return 'Checking TLS/HTTPS security...'
    case 'headers_check':
      return 'Verifying security headers...'
    case 'crypto_check':
      return 'Testing cryptographic capabilities...'
    case 'storage_check':
      return 'Checking secure storage...'
    case 'dom_protection':
      return 'Checking DOM protection...'
    case 'completed':
      return 'Security verification completed'
    case 'error':
      return 'Security check encountered an error'
    default:
      return 'Verifying your device for enhanced security'
  }
}

const getStepStatus = (step: SecurityCheckStep): boolean | null => {
  // Only return status if step is completed, otherwise return null
  if (!completedSteps.value.has(step)) {
    return null
  }

  // Return the stored result for completed steps
  return stepResults.value.get(step) ?? null
}

// Computed properties for E2E testing
const securityCheckComplete = computed(() => {
  return securityState.value.currentStep === 'completed'
})

const securityError = computed(() => {
  return securityState.value.currentStep === 'error'
})

const showRetryButton = computed(() => {
  return securityState.value.currentStep === 'error'
})
</script>

<style scoped>
.security-text {
  display: inline-block;
}

.animate-ellipsis {
  display: inline-block;
  min-width: 1.5rem;
  margin-left: 0.25rem;
}

.dot {
  display: inline-block;
  opacity: 0;
  animation: dotFade 1.4s infinite ease-in-out;
  font-weight: bold;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotFade {
  0%,
  15% {
    opacity: 0;
    transform: translateY(2px);
  }
  30%,
  85% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-2px);
  }
}

/* Optional: Add a subtle pulse to the main text */
.security-text {
  animation: textPulse 2s infinite ease-in-out;
}

@keyframes textPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.9;
  }
}
</style>
