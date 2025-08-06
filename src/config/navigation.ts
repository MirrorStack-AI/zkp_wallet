// Navigation configuration
export const NAVIGATION_CONFIG = {
  // Delay in milliseconds before navigating to welcome screen after security check completion
  welcomeNavigationDelay: 50,
} as const

export type NavigationConfig = typeof NAVIGATION_CONFIG
