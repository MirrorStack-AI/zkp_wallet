// TypeScript declarations for MirrorStack Wallet Extension API

declare global {
  interface Window {
    MirrorStackWallet: {
      requestAuthentication: (sourceUrl: string, destinationUrl: string) => Promise<{
        success: boolean
        requestId?: string
        error?: string
        status?: number
      }>
      isAvailable: () => boolean
      getInfo: () => Promise<{
        success: boolean
        data?: {
          version: string
          name: string
          description: string
          isInitialized: boolean
          features?: string[]
        }
        error?: string
      }>
    }
  }

  interface WindowEventMap {
    'MirrorStackWalletReady': CustomEvent<{
      version: string
      features: string[]
    }>
  }
}

export {} 