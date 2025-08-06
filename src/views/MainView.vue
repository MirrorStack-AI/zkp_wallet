<template>
  <div class="relative w-full h-full bg-[#f6fafe]" data-testid="main-view">
    <ContainerMain :show-settings="true" @navigate-to-settings="handleSettings">
      <div class="flex flex-col items-center justify-center gap-4 text-center p-8">
        <!-- Logo -->
        <div class="w-24 h-24 flex items-center justify-center" data-testid="logo">
          <IconLogo class="w-full h-full text-primary" />
        </div>

        <!-- Title -->
        <h1 class="text-2xl font-bold text-on-surface" data-testid="wallet-title">
          MirrorStack Wallet
        </h1>

        <!-- Security Status -->
        <p class="text-base font-medium text-on-surface-variant" data-testid="security-status">
          HSM Active | Security: 10/10
        </p>

        <!-- User Info -->
        <div class="w-full flex flex-col gap-2 p-2" data-testid="user-info">
          <div class="flex items-start gap-2.5 p-2">
            <span class="text-base font-medium text-on-surface-variant text-left">Email:</span>
            <span class="text-base font-medium text-on-surface-variant text-center flex-1">
              {{ email }}
            </span>
          </div>
          <div class="flex items-start gap-2.5 p-2">
            <span class="text-base font-medium text-on-surface-variant text-left">Username:</span>
            <span class="text-base font-medium text-on-surface-variant text-center flex-1">
              {{ username }}
            </span>
          </div>
        </div>

        <!-- Learn More Link -->
        <button
          class="text-base italic text-orange-500 underline hover:text-orange-600 transition-colors duration-300"
          data-testid="learn-more-link"
          @click="handleLearnMore"
        >
          🎓 Learn What is MirrorStack Wallet
        </button>
      </div>


    </ContainerMain>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ContainerMain from '@/components/ContainerMain.vue'
import IconLogo from '@/components/icons/IconLogo.vue'

// Define props for user data
interface Props {
  email?: string
  username?: string
}

const props = withDefaults(defineProps<Props>(), {
  email: 'nothingchang@mirrorstack.ai',
  username: 'nothingchang1118'
})

// Define emits for component-based navigation
const emit = defineEmits<{
  'navigate-to-welcome': []
  'navigate-to-send': []
  'navigate-to-receive': []
  'navigate-to-settings': []
}>()

// Handle button clicks
const handleSettings = () => {
  console.log('Settings button clicked')
  emit('navigate-to-settings')
}

const handleLearnMore = () => {
  console.log('Learn more clicked')
  // Add learn more logic here
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style> 