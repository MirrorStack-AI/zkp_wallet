<template>
  <div class="relative w-full h-full" data-testid="registration-seed-phase-view">
    <ContainerMain>
      <div class="flex flex-col items-center justify-center gap-2 text-center">
        <!-- Title -->
        <h1 class="text-2xl font-bold text-on-surface" data-testid="seed-phase-title">
          Remember Seed Phase
        </h1>

        <!-- User Info -->
        <div class="text-sm text-on-surface-variant text-left w-full max-w-[336px]" data-testid="user-info">
          <p class="mb-0">Email: {{ email }}</p>
          <p>Username: {{ username }}</p>
        </div>

        <!-- Warning Message -->
        <div class="text-sm text-error text-center w-full" data-testid="warning-message">
          ⚠️ Please store these Seed Phase Carefully ⚠️
        </div>

        <!-- Seed Phrase Grid -->
        <div class="w-full flex flex-col gap-3 px-2 h-[220px]">
          <div class="grid grid-cols-2 gap-2 w-full h-full">
            <div
              v-for="(word, index) in seedPhrase"
              :key="index"
              class="bg-secondary-container text-on-secondary-container rounded-2xl px-3 flex items-center justify-center gap-2.5"
              :data-testid="`seed-word-${index + 1}`"
            >
              <span class="text-left w-[21px] text-sm">{{ index + 1 }}.</span>
              <span class="text-center flex-1 text-sm">{{ word }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="w-full flex flex-col gap-2 mt-1">
          <!-- Continue Button -->
          
          <div class="flex gap-2 h-10">
            <button class="bg-tertiary-container rounded-2xl w-10 h-10 flex items-center justify-center flex-shrink-0">
              <!-- Download icon placeholder -->
              <span class="material-symbols-rounded text-on-tertiary-container">download</span>
            </button>
            <button
            class="flex-1 px-8 bg-primary text-on-primary rounded-2xl text-lg font-medium transition-all duration-300 hover:bg-primary-container hover:text-on-primary-container hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
            data-testid="continue-button"
            @click="emit('navigate-to-main')"
          >
            Continue
          </button>
            
          </div>

          <!-- Go Back Link -->
          <button
            class="text-xs text-on-surface-variant italic underline hover:text-on-surface transition-colors duration-300"
            data-testid="go-back-link"
            @click="emit('navigate-to-registration')"
          >
            Go Back to Last Step
          </button>
        </div>
      </div>
    </ContainerMain>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ContainerMain from '@/components/ContainerMain.vue'

// Define props for user data
interface Props {
  email?: string
  username?: string
}

const props = withDefaults(defineProps<Props>(), {
  email: 'jdps99119@gmail.com',
  username: 'nothingchang1118'
})

// Define emits for component-based navigation
const emit = defineEmits<{
  'navigate-to-registration': []
  'navigate-to-security-check': []
  'navigate-to-main': []
}>()

// Sample seed phrase from the Figma design
const seedPhrase = ref([
  'commons',
  'personhood',
  'abundance',
  'ownership',
  'capital',
  'forest',
  'tools',
  'resilience',
  'nonhuman',
  'oikonomia',
  'immutability',
  'growth'
])

// Salt input
const salt = ref('')

// Processing state
const isProcessing = ref(false)
</script>

<style scoped>
/* Additional custom styles if needed */
</style> 