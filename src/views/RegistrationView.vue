<template>
  <div class="relative w-full h-full" data-testid="registration-view">
    <ContainerMain>
      <div class="flex flex-col items-center justify-center gap-4 text-center">
        <IconLogo class="w-16 h-16 text-primary" data-testid="logo" />

        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-on-surface" data-testid="registration-title">
            Create New Account
          </h1>
          <p class="text-sm text-on-surface-variant" data-testid="registration-subtitle">
            Please enter your email address and User name.
          </p>
        </div>

        <!-- Form Inputs -->
        <div class="w-full flex flex-col gap-3 p-2">
          <!-- Email Input -->
          <EditText
            v-model="email"
            label="Email"
            type="email"
            required
            data-testid="email-input"
            :error-message="emailError"
            :show-error="false"
          />

          <!-- Username Input -->
          <EditText
            v-model="username"
            label="Username"
            type="text"
            required
            data-testid="username-input"
            :error-message="usernameError"
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
  'navigate-to-seed-phase': [email: string, username: string]
}>()

// Reactive state for form inputs
const email = ref('')
const username = ref('')
const showError = ref(false)

// Form validation errors
const emailError = ref('')
const usernameError = ref('')

// Form validation and submission logic can be added here later

// Handle continue button click
const handleContinue = () => {
  // Basic validation
  /*if (!email.value.trim() || !username.value.trim()) {
    showError.value = true
    return
  }*/
  
  // Navigate to seed phase view with user data
  emit('navigate-to-seed-phase', email.value.trim(), username.value.trim())
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style> 