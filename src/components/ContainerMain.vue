<template>
  <main
    class="bg-surface w-full p-6 flex flex-col items-center justify-center gap-4 h-auto relative"
    :style="{ maxHeight: `${clampedMaxHeight}px` }"
  >
    <!-- Theme Toggle positioned in top-right corner -->
    <div class="absolute top-4 right-4 z-10">
      <ThemeToggle />
    </div>

    <slot />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ThemeToggle from './ThemeToggle.vue'

interface ContainerProps {
  maxHeight?: number
}

const props = withDefaults(defineProps<ContainerProps>(), {
  maxHeight: 550,
})

// Validate and clamp maxHeight value
const clampedMaxHeight = computed(() => {
  const maxHeight = props.maxHeight

  // Handle invalid values
  if (typeof maxHeight !== 'number' || isNaN(maxHeight)) {
    console.warn('ContainerMain: Invalid maxHeight value provided, using 550')
    return 550
  }

  // Clamp between reasonable bounds (100px to 2000px)
  return Math.min(2000, Math.max(100, maxHeight))
})
</script>

<style scoped>
/* Component-specific styles can be added here if needed */
</style>
