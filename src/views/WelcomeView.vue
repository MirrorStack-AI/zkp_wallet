<template>
  <div class="relative w-full h-full bg-[#f6fafe]" data-testid="welcome-view">
    <ContainerMain>
      <div class="flex flex-col items-center justify-center gap-2 text-center">
        <IconLogo class="w-16 h-16 text-primary" data-testid="logo" />

        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-on-surface">
            <span class="security-text" data-testid="wallet-title"> MirrorStack Wallet </span>
          </h1>
          <p class="text-sm text-on-surface-variant" data-testid="welcome-subtitle">
            Welcome to MirrorStack Wallet
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="w-full py-2 px-4 flex flex-col gap-3">
          <!-- Create Account Button -->
          <button
            class="w-full h-24 px-6 bg-primary text-on-primary rounded-3xl text-left transition-all duration-300 hover:bg-primary-container hover:text-on-primary-container hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] group"
            data-testid="create-account-button"
            @click="emit('navigate-to-registration')"
          >
            <div class="flex items-center gap-2 mb-2">
              <div class="w-6 h-6 flex items-center justify-center">
                <!-- Checkbook icon -->
                <span class="material-symbols-rounded text-2xl transition-colors duration-300"
                  >description</span
                >
              </div>
              <span class="text-lg font-semibold w-full text-center transition-colors duration-300"
                >Create an Account</span
              >
            </div>
            <p
              class="text-xs font-semibold text-on-primary/90 group-hover:text-on-primary-container leading-relaxed transition-colors duration-300"
            >
              Sign Up for an Account with your Email, Name, and store the passphase
            </p>
          </button>

          <!-- Restore Account Button -->
          <button
            class="w-full h-24 px-6 border-2 border-outline text-on-surface rounded-3xl text-left transition-all duration-300 hover:bg-surface-variant hover:text-on-surface-variant hover:scale-[1.02] hover:shadow-lg hover:shadow-outline/25 active:scale-[0.98] group"
            data-testid="restore-account-button"
            @click="emit('navigate-to-restore')"
          >
            <div class="flex items-center gap-2 mb-2">
              <div class="w-6 h-6 flex items-center justify-center">
                <!-- Enable/restore icon -->
                <span class="material-symbols-rounded text-2xl transition-colors duration-300"
                  >restore</span
                >
              </div>
              <span class="text-lg font-semibold w-full text-center transition-colors duration-300"
                >Restore your Account</span
              >
            </div>
            <p
              class="text-xs font-semibold text-on-surface-variant group-hover:text-on-surface-variant leading-relaxed transition-colors duration-300"
            >
              Restore your account via your passphrase.
            </p>
          </button>

          <!-- Import Cold Wallet Button -->
          <button
            class="w-full h-12 px-6 border-2 border-tertiary text-tertiary rounded-3xl text-left transition-all duration-300 hover:bg-tertiary-container hover:text-on-tertiary-container hover:scale-[1.02] hover:shadow-lg hover:shadow-tertiary/25 active:scale-[0.98] group"
            data-testid="import-cold-wallet-button"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 flex items-center justify-center">
                <!-- Key icon -->
                <span class="material-symbols-rounded text-2xl transition-colors duration-300"
                  >key</span
                >
              </div>
              <span class="text-lg font-semibold w-full text-center transition-colors duration-300"
                >Import Cold Wallet</span
              >
            </div>
          </button>
        </div>
      </div>
    </ContainerMain>
  </div>
</template>

<script setup lang="ts">
import ContainerMain from '@/components/ContainerMain.vue'
import IconLogo from '@/components/icons/IconLogo.vue'

// Define emits for component-based navigation
const emit = defineEmits<{
  'navigate-to-registration': []
  'navigate-to-restore': []
}>()
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
