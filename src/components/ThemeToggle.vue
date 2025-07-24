<template>
  <button
    @click="toggleTheme"
    class="p-1 w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors flex items-center justify-center"
    aria-label="Toggle theme"
    data-testid="theme-toggle"
  >
    <span v-if="theme === 'dark'" class="material-symbols-rounded">dark_mode</span>
    <span v-else-if="theme === 'light'" class="material-symbols-rounded">light_mode</span>
    <span v-else class="material-symbols-rounded">brightness_auto</span>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Chrome extension types
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: (message: { type: string; theme?: string }) => Promise<unknown>
      }
    }
  }
}

// Theme types
type Theme = 'light' | 'dark' | 'auto'

// Valid theme values
const VALID_THEMES: Theme[] = ['light', 'dark', 'auto']

// Reactive state for theme
const theme = ref<Theme>('auto')

// Media query listener reference for cleanup
let mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null

// Check system preference
const getSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Validate theme value
const isValidTheme = (value: unknown): value is Theme => {
  return typeof value === 'string' && VALID_THEMES.includes(value as Theme)
}

// Apply theme to document with error handling
const applyTheme = (newTheme: Theme) => {
  try {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    if (newTheme === 'auto') {
      // Auto mode - use system preference
      const systemTheme = getSystemTheme()
      root.classList.add(systemTheme)
      root.setAttribute('data-theme', 'auto')
    } else {
      // Manual mode
      root.classList.add(newTheme)
      root.setAttribute('data-theme', newTheme)
    }
  } catch (error) {
    console.error('Failed to apply theme:', error)
    // Fallback to light theme
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add('light')
    root.setAttribute('data-theme', 'light')
  }
}

// Save theme to localStorage with error handling
const saveTheme = (themeValue: Theme) => {
  try {
    localStorage.setItem('theme', themeValue)
  } catch (error) {
    console.error('Failed to save theme to localStorage:', error)
  }
}

// Load theme from localStorage with error handling
const loadTheme = (): Theme => {
  try {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme && isValidTheme(savedTheme)) {
      return savedTheme
    }
  } catch (error) {
    console.error('Failed to load theme from localStorage:', error)
  }
  return 'auto' // Default to auto (system preference)
}

// Check saved preference and system preference on component mount
onMounted(async () => {
  // Load saved theme
  theme.value = loadTheme()
  applyTheme(theme.value)

  // Notify background script about current theme on mount
  try {
    if (window.chrome?.runtime?.sendMessage) {
      const resolvedTheme = theme.value === 'auto' ? getSystemTheme() : theme.value
      await window.chrome.runtime.sendMessage({
        type: 'CHANGE_THEME',
        theme: resolvedTheme,
      })
    }
  } catch (error) {
    console.error('Failed to notify background script about initial theme:', error)
  }

  // Listen for system theme changes when in auto mode
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQueryListener = () => {
    if (theme.value === 'auto') {
      applyTheme('auto')
      // Also notify background script when system theme changes
      window.chrome?.runtime
        ?.sendMessage?.({
          type: 'CHANGE_THEME',
          theme: getSystemTheme(),
        })
        .catch((error) => {
          console.error('Failed to notify background script about system theme change:', error)
        })
    }
  }

  mediaQuery.addEventListener('change', mediaQueryListener)
})

// Cleanup on component unmount
onUnmounted(() => {
  if (mediaQueryListener) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.removeEventListener('change', mediaQueryListener)
    mediaQueryListener = null
  }
})

// Toggle theme (light -> dark -> auto -> light)
const toggleTheme = async () => {
  const themes: Theme[] = ['light', 'dark', 'auto']
  const currentIndex = themes.indexOf(theme.value)
  const nextIndex = (currentIndex + 1) % themes.length

  const newTheme = themes[nextIndex]
  theme.value = newTheme
  applyTheme(theme.value)
  saveTheme(theme.value)

  // Notify background script about theme change
  try {
    if (window.chrome?.runtime?.sendMessage) {
      await window.chrome.runtime.sendMessage({
        type: 'CHANGE_THEME',
        theme: newTheme === 'auto' ? getSystemTheme() : newTheme,
      })
    }
  } catch (error) {
    console.error('Failed to notify background script about theme change:', error)
  }
}
</script>
