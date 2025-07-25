<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SecurityCheckView from './views/SecurityCheckView.vue'
import WelcomeView from './views/WelcomeView.vue'

// Component-based navigation state
const currentView = ref<'security-check' | 'welcome'>('security-check')

// Function to switch to welcome view
const switchToWelcome = () => {
  console.log('App: Switching to welcome view')
  currentView.value = 'welcome'
}

// Initialize the app
onMounted(() => {
  console.log('App: Initialized with security-check view')
})
</script>

<template>
  <div class="max-w-[400px] bg-transparent">
    <SecurityCheckView
      v-if="currentView === 'security-check'"
      @navigate-to-welcome="switchToWelcome"
    />
    <WelcomeView v-else-if="currentView === 'welcome'" />
  </div>
</template>

<style scoped>
/* App-level styles */
</style>
