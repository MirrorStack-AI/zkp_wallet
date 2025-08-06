<template>
  <div class="relative w-full h-full bg-surface" data-testid="settings-view">
    <ContainerMain>
      <!-- Header with back arrow and title -->
      <div class="flex flex-row gap-2 items-center justify-start w-full mb-4">
        <button
          class="w-10 h-10 flex items-center justify-center transition-all duration-300 hover:bg-surface-variant rounded-full"
          data-testid="back-button"
          @click="handleBack"
        >
          <span class="material-symbols-rounded text-on-surface text-2xl">arrow_back</span>
        </button>
        <h1 class="text-2xl font-bold text-on-surface">Settings</h1>
      </div>

      <!-- Settings Content -->
      <div class="flex flex-col gap-3 w-full p-4">
        <!-- Security Section -->
        <div class="w-full">
          <h2 class="text-base font-semibold text-primary mb-3">Security</h2>
          
          <!-- Hardware Security Module -->
          <div class="bg-surface-container rounded-2xl p-3 mb-3 border border-outline/20">
            <div class="text-base font-normal text-on-surface">
              🛡️ Hardware Security Module
            </div>
            <div class="text-sm font-normal text-on-surface-variant">
              Status: Active | Level: FIPS 140-2 Level 3
            </div>
          </div>

          <!-- Biometric Authentication -->
          <div class="bg-surface-container rounded-2xl p-3 border border-outline/20">
            <div class="text-base font-normal text-on-surface">
              🛡️ Biometric Authentication
            </div>
            <div class="text-sm font-normal text-on-surface-variant">
              Status: Enabled | Type: Touch ID / Face ID
            </div>
          </div>
        </div>
      </div>

      <!-- Logout Button -->
      <div class="w-full mt-4 px-4">
        <button
          class="w-full bg-error text-on-error font-medium py-3 px-8 rounded-2xl transition-all duration-300 hover:bg-error-container hover:text-on-error-container"
          data-testid="logout-button"
          @click="handleLogout"
        >
          Logout
        </button>
      </div>
    </ContainerMain>
  </div>
</template>

<script setup lang="ts">
import ContainerMain from '@/components/ContainerMain.vue'

// Define emits for navigation
const emit = defineEmits<{
  'navigate-to-main': []
  'navigate-to-welcome': []
}>()

// Handle back button click
const handleBack = () => {
  console.log('Back button clicked')
  emit('navigate-to-main')
}

// Handle logout button click
const handleLogout = () => {
  console.log('Logout button clicked')
  // Add logout logic here
  emit('navigate-to-welcome')
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>