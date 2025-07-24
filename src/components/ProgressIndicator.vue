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
        class="h-full bg-primary rounded-full transition-all duration-500 ease-out"
        :style="{ width: `${clampedProgress}%` }"
        :class="{ 'animate-pulse': isActive }"
      ></div>
    </div>

    <!-- Optional Description -->
    <p v-if="description" class="text-xs text-on-surface-variant mt-2 text-center">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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

// Track the highest progress value to prevent backward movement
const highestProgress = ref(0)

// Validate and clamp progress value
const clampedProgress = computed(() => {
  const progress = props.progress

  // Handle invalid values
  if (typeof progress !== 'number' || isNaN(progress)) {
    console.warn('ProgressIndicator: Invalid progress value provided, using 0')
    return 0
  }

  // Clamp between 0 and 100 and ensure it only moves forward
  const clamped = Math.min(100, Math.max(0, progress))
  return Math.max(highestProgress.value, clamped)
})

// Track if progress is actively updating
const isActive = computed(() => {
  return props.progress > 0 && props.progress < 100
})

// Watch for progress changes to ensure smooth transitions
watch(
  () => props.progress,
  (newProgress) => {
    if (typeof newProgress === 'number' && !isNaN(newProgress)) {
      const clamped = Math.min(100, Math.max(0, newProgress))
      if (clamped > highestProgress.value) {
        highestProgress.value = clamped
      }
    }
  },
  { immediate: true },
)
</script>

<style scoped>
/* Component-specific styles can be added here if needed */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
