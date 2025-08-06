// MirrorStack Wallet API - Web Accessible Resource
// This script runs in the web page context and communicates with the content script

(function() {
  'use strict';

  // Create the API object
  const createAPI = () => {
    return {
      requestAuthentication: async (sourceUrl, destinationUrl) => {
        try {
          console.log('MirrorStack Wallet: Website requesting authentication:', { sourceUrl, destinationUrl })
          
          // Send message to content script
          const response = await new Promise((resolve, reject) => {
            window.postMessage({
              type: 'MIRRORSTACK_AUTH_REQUEST',
              data: { sourceUrl, destinationUrl }
            }, '*')
            
            const handleResponse = (event) => {
              if (event.data && event.data.type === 'MIRRORSTACK_AUTH_RESPONSE') {
                window.removeEventListener('message', handleResponse)
                resolve(event.data.response)
              }
            }
            
            window.addEventListener('message', handleResponse)
            
            // Timeout after 5 seconds
            setTimeout(() => {
              window.removeEventListener('message', handleResponse)
              reject(new Error('Request timeout'))
            }, 5000)
          })
          
          return response
        } catch (error) {
          console.error('MirrorStack Wallet: Authentication request failed:', error)
          return {
            success: false,
            error: error.message
          }
        }
      },
      isAvailable: () => {
        return true
      },
      getInfo: async () => {
        return {
          success: true,
          data: {
            version: '0.1.0',
            features: ['authentication', 'security-check']
          }
        }
      },
      clearAuthenticationStatus: async (requestId) => {
        try {
          console.log('MirrorStack Wallet: Website requesting to clear auth status:', requestId)
          
          // Send message to content script
          const response = await new Promise((resolve, reject) => {
            console.log('MirrorStack Wallet: Sending clear auth request to content script')
            window.postMessage({
              type: 'MIRRORSTACK_CLEAR_AUTH_REQUEST',
              data: { requestId }
            }, '*')
            
            const handleResponse = (event) => {
              if (event.data && event.data.type === 'MIRRORSTACK_CLEAR_AUTH_RESPONSE') {
                console.log('MirrorStack Wallet: Received clear auth response:', event.data.response)
                window.removeEventListener('message', handleResponse)
                resolve(event.data.response)
              }
            }
            
            window.addEventListener('message', handleResponse)
            
            // Timeout after 5 seconds
            setTimeout(() => {
              console.log('MirrorStack Wallet: Clear auth request timed out')
              window.removeEventListener('message', handleResponse)
              reject(new Error('Request timeout'))
            }, 5000)
          })
          
          console.log('MirrorStack Wallet: Clear auth status completed:', response)
          return response
        } catch (error) {
          console.error('MirrorStack Wallet: Clear auth status request failed:', error)
          return {
            success: false,
            error: error.message
          }
        }
      },
      sendMessage: async (message) => {
        try {
          console.log('MirrorStack Wallet: Website sending message to background:', message)
          
          // Send message to content script
          const response = await new Promise((resolve, reject) => {
            console.log('MirrorStack Wallet: Sending message to content script')
            window.postMessage({
              type: 'MIRRORSTACK_SEND_MESSAGE',
              data: message
            }, '*')
            
            const handleResponse = (event) => {
              if (event.data && event.data.type === 'MIRRORSTACK_SEND_MESSAGE_RESPONSE') {
                console.log('MirrorStack Wallet: Received send message response:', event.data.response)
                window.removeEventListener('message', handleResponse)
                resolve(event.data.response)
              }
            }
            
            window.addEventListener('message', handleResponse)
            
            // Timeout after 5 seconds
            setTimeout(() => {
              console.log('MirrorStack Wallet: Send message request timed out')
              window.removeEventListener('message', handleResponse)
              reject(new Error('Request timeout'))
            }, 5000)
          })
          
          console.log('MirrorStack Wallet: Send message completed:', response)
          return response
        } catch (error) {
          console.error('MirrorStack Wallet: Send message request failed:', error)
          return {
            success: false,
            error: error.message
          }
        }
      }
    }
  }

  // Create and expose the API
  const api = createAPI()

  // Expose to window
  try {
    Object.defineProperty(window, 'MirrorStackWallet', {
      value: api,
      writable: false,
      configurable: false,
      enumerable: true
    })
  } catch (error) {
    console.log('MirrorStack Wallet: Could not define property, using direct assignment')
    window.MirrorStackWallet = api
  }

  // Create backup reference
  window.__MirrorStackWalletBackup = api

  // Dispatch ready event
  try {
    window.dispatchEvent(new CustomEvent('MirrorStackWalletReady', {
      detail: {
        version: '0.1.0',
        features: ['authentication', 'security-check']
      }
    }))
  } catch (error) {
    console.log('MirrorStack Wallet: Could not dispatch ready event:', error)
  }

  console.log('MirrorStack Wallet: Authentication API exposed to website')
})() 