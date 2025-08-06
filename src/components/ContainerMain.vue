<template>
  <main
    class="bg-surface w-full p-6 flex flex-col items-center justify-center gap-4 h-full relative"
    :style="{ maxHeight: `${clampedMaxHeight}px`, minHeight: `${clampedMaxHeight}px` }"
  >
    <!-- Theme Toggle positioned in top-right corner -->
    <div class="absolute top-4 right-4 z-10">
      <div class="flex gap-2">
        <button
          v-if="showSettings"
          class="w-10 h-10 bg-surface-container rounded-[22px] flex items-center justify-center transition-all duration-300 hover:bg-surface-variant z-10"
          data-testid="settings-icon"
          @click="handleSettings"
        >
          <span class="material-symbols-rounded text-on-surface">settings</span>
        </button>
        <ThemeToggle />
      </div>
    </div>


    <slot />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ThemeToggle from './ThemeToggle.vue'

interface ContainerProps {
  maxHeight?: number
  showSettings?: boolean
}

const props = withDefaults(defineProps<ContainerProps>(), {
  maxHeight: 500,
  showSettings: false,
})

// Define emits for settings navigation
const emit = defineEmits<{
  'navigate-to-settings': []
}>()

// Validate and clamp maxHeight value
const clampedMaxHeight = computed(() => {
  const maxHeight = props.maxHeight

  // Handle invalid values
  if (typeof maxHeight !== 'number' || isNaN(maxHeight)) {
    console.warn('ContainerMain: Invalid maxHeight value provided, using 500')
    return 500
  }

  // Clamp between reasonable bounds (100px to 2000px)
  return Math.min(2000, Math.max(100, maxHeight))
})

// Handle settings button click
const handleSettings = () => {
  console.log('Settings button clicked')
  emit('navigate-to-settings')
}
</script>

<style scoped>
/* Component-specific styles can be added here if needed */
</style>
