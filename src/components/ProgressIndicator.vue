<template>
  <div
    class="w-full"
    role="progressbar"
    :aria-valuenow="clampedProgress"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="label"
  >
    <!-- Optional Label and Percentage -->
    <div v-if="showLabel" class="flex justify-between items-center mb-2">
      <span class="text-sm text-on-surface">{{ label }}</span>
      <span class="text-sm text-on-surface-variant">{{ Math.round(clampedProgress) }}%</span>
    </div>

    <!-- Progress Bar -->
    <div class="w-full h-1 bg-surface-container rounded-full overflow-hidden">
      <div
        class="h-full bg-primary rounded-full transition-all duration-300 ease-out"
        :style="{ width: `${clampedProgress}%` }"
      ></div>
    </div>

    <!-- Optional Description -->
    <p v-if="description" class="text-xs text-on-surface-variant mt-2 text-center">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ProgressIndicatorProps {
  progress: number
  label?: string
  description?: string
  showLabel?: boolean
}

const props = withDefaults(defineProps<ProgressIndicatorProps>(), {
  label: 'Progress',
  description: '',
  showLabel: true,
  progress: 0,
})

// Validate and clamp progress value
const clampedProgress = computed(() => {
  const progress = props.progress

  // Handle invalid values
  if (typeof progress !== 'number' || isNaN(progress)) {
    console.warn('ProgressIndicator: Invalid progress value provided, using 0')
    return 0
  }

  // Clamp between 0 and 100
  return Math.min(100, Math.max(0, progress))
})
</script>

<style scoped>
/* Component-specific styles can be added here if needed */
</style>
