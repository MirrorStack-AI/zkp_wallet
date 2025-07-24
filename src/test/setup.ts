/**
 * Test Setup File
 * Mocks browser APIs that are missing in JSDOM environment
 */

import { vi } from 'vitest'

// Mock window.matchMedia for theme testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

// Mock HTMLCanvasElement.getContext for device fingerprinting
// Commented out due to TypeScript type conflicts - not critical for tests
/*
const originalGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function (contextId: string, ...args: unknown[]) {
  if (contextId === '2d') {
    const mockContext = {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    return mockContext
  }
  // For other context types, return null to avoid type conflicts
  return null
} as any
*/

// Mock chrome extension APIs
Object.defineProperty(window, 'chrome', {
  writable: true,
  value: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
      sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
    },
    sidePanel: {
      setOptions: vi.fn(),
    },
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
})

// Mock crypto API for testing
Object.defineProperty(window, 'crypto', {
  writable: true,
  value: {
    subtle: {
      generateKey: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn(),
      digest: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      exportKey: vi.fn(),
      importKey: vi.fn(),
    },
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    }),
  },
})

// Mock navigator for device fingerprinting
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    ...window.navigator,
    platform: 'Win32',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'en-US',
    languages: ['en-US', 'en'],
    hardwareConcurrency: 8,
    maxTouchPoints: 0,
    onLine: true,
    cookieEnabled: true,
    doNotTrack: null,
    geolocation: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    mediaDevices: {
      enumerateDevices: vi.fn(() => Promise.resolve([])),
      getUserMedia: vi.fn(() => Promise.resolve({})),
    },
    permissions: {
      query: vi.fn(() => Promise.resolve({ state: 'granted' })),
    },
  },
})

// Mock screen for device fingerprinting
Object.defineProperty(window, 'screen', {
  writable: true,
  value: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
    pixelDepth: 24,
    orientation: {
      type: 'landscape-primary',
      angle: 0,
    },
  },
})

// Mock location for extension context
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    protocol: 'chrome-extension:',
    hostname: 'extension',
    pathname: '/popup.html',
    href: 'chrome-extension://test/popup.html',
  },
})

// Mock document for DOM testing with proper classList
Object.defineProperty(document, 'documentElement', {
  writable: true,
  value: {
    clientWidth: 1920,
    clientHeight: 1080,
    scrollWidth: 1920,
    scrollHeight: 1080,
    offsetWidth: 1920,
    offsetHeight: 1080,
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
    },
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
  },
})

// Mock console methods to reduce noise in tests
Object.defineProperty(console, 'warn', {
  writable: true,
  value: vi.fn(),
})
Object.defineProperty(console, 'error', {
  writable: true,
  value: vi.fn(),
})
