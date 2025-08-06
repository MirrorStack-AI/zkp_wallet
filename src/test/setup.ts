/**
 * Test Setup File
 * Mocks browser APIs that are missing in JSDOM environment
 */

import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock the security service module globally
vi.mock('@/services/security-check', () => {
  return {
    SecurityCheckOrchestrator: vi.fn().mockImplementation(() => ({
      getState: vi.fn(() => ({
        isChecking: false,
        isComplete: false,
        isSuccess: false,
        error: null as string | null,
        progress: 0,
        currentStep: null as string | null,
        results: [] as Array<{ name: string; success: boolean; details?: string }>
      })),
      startCheck: vi.fn(),
      stopCheck: vi.fn(),
      resetCheck: vi.fn()
    }))
  }
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.chrome
Object.defineProperty(window, 'chrome', {
  writable: true,
  value: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
      }
    },
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      },
      getURL: vi.fn()
    }
  }
})

// Mock window.browser (Firefox)
Object.defineProperty(window, 'browser', {
  writable: true,
  value: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
      }
    },
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      },
      getURL: vi.fn()
    }
  }
})

// Mock crypto API
Object.defineProperty(window, 'crypto', {
  writable: true,
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  }
})

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    platform: 'MacIntel',
    language: 'en-US',
    languages: ['en-US', 'en'],
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('')
    }
  }
})

// Mock screen
Object.defineProperty(window, 'screen', {
  writable: true,
  value: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
    pixelDepth: 24
  }
})

// Mock location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: ''
  }
})

// Mock document.documentElement
Object.defineProperty(document, 'documentElement', {
  writable: true,
  value: {
    style: {
      setProperty: vi.fn(),
      getPropertyValue: vi.fn()
    },
    classList: {
      remove: vi.fn(),
      add: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn()
    },
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    removeAttribute: vi.fn()
  }
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }
})

// Mock MirrorStackWallet
Object.defineProperty(window, 'MirrorStackWallet', {
  writable: true,
  value: {
    version: '1.0.0',
    features: ['authentication', 'security-check'],
    authenticate: vi.fn(),
    checkStatus: vi.fn(),
    sendMessage: vi.fn(),
    isAvailable: vi.fn(),
    getInfo: vi.fn(),
    generateSeedPhrase: vi.fn(),
    verifySignature: vi.fn(),
    requestAuthentication: vi.fn(),
    clearAuthenticationStatus: vi.fn()
  }
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 0)
  return 1
}) as any
global.cancelAnimationFrame = vi.fn()

// Mock window methods
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: vi.fn()
})

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: vi.fn()
})

Object.defineProperty(window, 'close', {
  writable: true,
  value: vi.fn()
})

// Mock history
Object.defineProperty(window, 'history', {
  writable: true,
  value: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    length: 1
  }
})

// Configure Vue Test Utils
config.global.stubs = {
  'router-link': true,
  'router-view': true,
}
