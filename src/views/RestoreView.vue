<template>
  <div class="relative w-full h-full" data-testid="restore-view">
    <ContainerMain>
      <div class="flex flex-col w-full items-center justify-center gap-3 text-center">
        <IconLogo class="w-16 h-16 text-primary" data-testid="logo" />

        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-on-surface" data-testid="restore-title">
            Restore Your Wallet
          </h1>
          <p class="text-sm text-on-surface-variant" data-testid="restore-subtitle">
            Enter your seed phrase with space<br/>to restore your wallet
          </p>
        </div>

        <!-- Form Inputs -->
        <div class="w-full flex flex-col gap-3 px-2">
          <!-- Seed Phrase Input -->
          <EditText
            v-model="seedPhrase"
            label="Seed Phrase"
            type="text"
            textarea
            :rows="3"
            placeholder="12-Seed-Phase"
            focus-only-placeholder
            required
            data-testid="seed-phrase-input"
            :error-message="seedPhraseError"
            :show-error="false"
          />

          <!-- Salt Input -->
          <EditText
            v-model="salt"
            label="Salt"
            type="text"
            required
            data-testid="salt-input"
            :error-message="saltError"
            :show-error="false"
          />
        </div>

        <!-- Action Buttons -->
        <div class="w-full flex flex-col gap-2">
          <!-- Continue Button -->
          <button
            class="w-full py-3 px-8 bg-primary text-on-primary rounded-2xl text-lg font-medium transition-all duration-300 hover:bg-primary-container hover:text-on-primary-container hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
            data-testid="continue-button"
            @click="handleContinue"
          >
            Continue
          </button>

          <!-- Go Back Link -->
          <button
            class="text-xs text-on-surface-variant italic underline hover:text-on-surface transition-colors duration-300"
            data-testid="go-back-link"
            @click="emit('navigate-to-welcome')"
          >
            Go back to Welcome Page
          </button>
        </div>

        <!-- Error Message (hidden by default) -->
        <div
          v-if="showError"
          class="text-sm text-error text-center max-w-[268px]"
          data-testid="error-message"
        >
          Error: AKLFSAJLKFJSFJQ), need help?
        </div>
      </div>
    </ContainerMain>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ContainerMain from '@/components/ContainerMain.vue'
import IconLogo from '@/components/icons/IconLogo.vue'
import EditText from '@/components/EditText.vue'

// Define emits for component-based navigation
const emit = defineEmits<{
  'navigate-to-welcome': []
  'navigate-to-security-check': []
  'navigate-to-main': []
}>()

// Reactive state for form inputs
const seedPhrase = ref('')
const salt = ref('')
const showError = ref(false)

// Form validation errors
const seedPhraseError = ref('')
const saltError = ref('')

// Handle continue button click
const handleContinue = () => {
  // Validate inputs
  /* if (!seedPhrase.value.trim()) {
    seedPhraseError.value = 'Seed phrase is required'
    return
  }
  
  if (!salt.value.trim()) {
    saltError.value = 'Salt is required'
    return
  }*/

  // Clear errors if validation passes
  seedPhraseError.value = ''
  saltError.value = ''

  // Continue with restore process
  console.log('Continuing with restore process...')
  // Add your restore logic here
  emit('navigate-to-main')
}

// Form validation and submission logic can be added here later
</script>

<style scoped>
/* Additional custom styles if needed */
</style> 