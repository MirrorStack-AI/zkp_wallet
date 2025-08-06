<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import SecurityCheckView from './views/SecurityCheckView.vue'
import WelcomeView from './views/WelcomeView.vue'
import RegistrationView from './views/RegistrationView.vue'
import RegistrationSeedPhaseView from './views/RegistrationSeedPhaseView.vue'
import RestoreView from './views/RestoreView.vue'
import MainView from './views/MainView.vue'
import SettingsView from './views/SettingsView.vue'
import AuthenticationView from './views/AuthenticationView.vue'
import AuthenticationFailedView from './views/AuthenticationFailedView.vue'
import BehaviorView from './views/BehaviorView.vue'
import BiometricView from './views/BiometricView.vue'
import TestView from './views/TestView.vue'

// Component-based navigation state
const currentView = ref<'security-check' | 'welcome' | 'registration' | 'registration-seed-phase' | 'restore' | 'main' | 'settings' | 'authentication' | 'authentication-failed' | 'behavior' | 'biometric' | 'test'>('security-check')

// User data for seed phase view
const userEmail = ref('')
const userUsername = ref('')

// Authentication data
const authSourceUrl = ref('')
const authDestinationUrl = ref('')
const authRequestId = ref('')
const authErrorMessage = ref('')

// Behavior verification data
const behaviorRequestId = ref('')
const behaviorNumberToSign = ref('187')

// Biometric verification data
const biometricRequestId = ref('')
const biometricSignature = ref('')
const biometricSourceUrl = ref('')
const biometricDestinationUrl = ref('')

// Function to switch to welcome view
const switchToWelcome = () => {
  console.log('App: Switching to welcome view')
  currentView.value = 'welcome'
}

// Function to switch to registration view
const switchToRegistration = () => {
  console.log('App: Switching to registration view')
  currentView.value = 'registration'
}

// Function to switch to restore view
const switchToRestore = () => {
  console.log('App: Switching to restore view')
  currentView.value = 'restore'
}

// Function to switch to registration seed phase view
const switchToRegistrationSeedPhase = (email: string, username: string) => {
  console.log('App: Switching to registration seed phase view')
  userEmail.value = email
  userUsername.value = username
  currentView.value = 'registration-seed-phase'
}

// Function to switch to main view
const switchToMain = () => {
  console.log('App: Switching to main view')
  currentView.value = 'main'
}

// Function to switch to settings view
const switchToSettings = () => {
  console.log('App: Switching to settings view')
  currentView.value = 'settings'
}

// Function to switch to authentication view
const switchToAuthentication = (sourceUrl: string, destinationUrl: string, requestId: string) => {
  console.log('App: Switching to authentication view')
  authSourceUrl.value = sourceUrl
  authDestinationUrl.value = destinationUrl
  authRequestId.value = requestId
  currentView.value = 'authentication'
}

// Function to switch to authentication failed view
const switchToAuthenticationFailed = (errorMessage: string, requestId?: string) => {
  console.log('App: Switching to authentication failed view')
  authErrorMessage.value = errorMessage
  authRequestId.value = requestId || ''
  currentView.value = 'authentication-failed'
}

// Function to switch to test view
const switchToTest = () => {
  console.log('App: Switching to test view')
  currentView.value = 'test'
}

// Function to switch to behavior view
const switchToBehavior = (requestId: string, numberToSign?: string) => {
  console.log('App: Switching to behavior view')
  behaviorRequestId.value = requestId
  behaviorNumberToSign.value = numberToSign || '187'
  currentView.value = 'behavior'
}

// Function to switch to biometric view
const switchToBiometric = (requestId: string, signature: string, sourceUrl?: string, destinationUrl?: string) => {
  console.log('App: Switching to biometric view')
  biometricRequestId.value = requestId
  biometricSignature.value = signature
  biometricSourceUrl.value = sourceUrl || authSourceUrl.value
  biometricDestinationUrl.value = destinationUrl || authDestinationUrl.value
  currentView.value = 'biometric'
}

// Function to switch to security check view
const switchToSecurityCheck = () => {
  console.log('App: Switching to security check view')
  currentView.value = 'security-check'
}

// Function to handle security check completion with pending auth
const handleSecurityCheckToAuth = async () => {
  console.log('App: Security check completed, switching to authentication view')
  
  try {
    // Get auth data from chrome storage instead of URL parameters
    if ((window.chrome as any)?.storage?.local) {
      const result = await (window.chrome as any).storage.local.get(['authRequests'])
      const authRequests = result.authRequests || {}
      
      // Find the pending authentication request
      const pendingRequest = Object.values(authRequests).find((request: any) => 
        request.status === 'pending'
      ) as any
      
      if (pendingRequest) {
        console.log('App: Found pending auth request:', pendingRequest)
        
        // Send extension_opened status to background script
        if ((window.chrome as any)?.runtime?.sendMessage) {
          try {
            await (window.chrome as any).runtime.sendMessage({
              type: 'EXTENSION_OPENED_WITH_PENDING_AUTH',
              requestId: pendingRequest.requestId
            })
            console.log('App: Sent extension_opened status to background script')
          } catch (error) {
            console.error('App: Failed to send extension_opened status:', error)
          }
        }
        switchToAuthentication(
          pendingRequest.sourceUrl || '',
          pendingRequest.destinationUrl || '',
          pendingRequest.requestId || ''
        )
      } else {
        console.log('App: No pending auth request found, going to welcome')
        switchToWelcome()
      }
    } else {
      console.log('App: Chrome storage not available, going to welcome')
      switchToWelcome()
    }
  } catch (error) {
    console.error('App: Error getting auth data from storage:', error)
    switchToWelcome()
  }
}

// Authentication event handlers
const handleAuthSuccess = (requestId: string) => {
  console.log('App: Authentication successful for request', requestId)
  // Navigate to behavior view after successful authentication
  switchToBehavior(requestId)
}

const handleAuthError = (error: string) => {
  console.error('App: Authentication failed', error)
  // Navigate to authentication failed view
  switchToAuthenticationFailed(error, authRequestId.value)
}

const handleAuthFailed = (error: string) => {
  console.error('App: Authentication failed', error)
  // Navigate to authentication failed view
  switchToAuthenticationFailed(error, authRequestId.value)
}

const handleAuthFailedClose = () => {
  console.log('App: Closing extension due to authentication failure')
  // Close the extension window
  if ((window.chrome as any)?.windows?.getCurrent) {
    try {
      (window.chrome as any).windows.getCurrent().then((currentWindow: any) => {
        (window.chrome as any).windows.update(currentWindow.id, { focused: false })
        window.close()
      })
    } catch (error) {
      console.error('App: Failed to close extension window:', error)
      window.close()
    }
  } else {
    window.close()
  }
}

const handleAuthCancel = () => {
  console.log('App: Authentication cancelled')
  // Navigate back to security check view
  switchToSecurityCheck()
}

// Behavior verification event handlers
const handleBehaviorSuccess = (requestId: string, signature: string) => {
  console.log('App: Behavioral verification successful for request', requestId)
  // Navigate to main view after successful behavioral verification
  switchToMain()
}

const handleBehaviorError = (error: string) => {
  console.error('App: Behavioral verification failed', error)
  // Navigate to authentication failed view
  switchToAuthenticationFailed(error, behaviorRequestId.value)
}

// Biometric verification event handlers
const handleBiometricSuccess = (requestId: string) => {
  console.log('App: Biometric verification successful for request', requestId)
  // Navigate to main view after successful biometric verification
  switchToMain()
}

const handleBiometricError = (error: string) => {
  console.error('App: Biometric verification failed', error)
  // Navigate to authentication failed view
  switchToAuthenticationFailed(error, biometricRequestId.value)
}

// URL change handler
const handleUrlChange = () => {
  const currentPath = window.location.pathname
  if (currentPath === '/test') {
    console.log('App: Detected /test route, switching to test view')
    switchToTest()
  }
}

// Parse URL parameters
const parseUrlParameters = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const view = urlParams.get('view')
  
  if (view === 'authentication') {
    const sourceUrl = urlParams.get('sourceUrl') || ''
    const destinationUrl = urlParams.get('destinationUrl') || ''
    const requestId = urlParams.get('requestId') || ''
    
    console.log('App: Detected authentication view in URL parameters:', { sourceUrl, destinationUrl, requestId })
    switchToAuthentication(sourceUrl, destinationUrl, requestId)
    return true
  }
  
  return false
}

// Initialize the app
onMounted(() => {
  console.log('App: Initialized with security-check view')
  
  // Check URL parameters first
  if (parseUrlParameters()) {
    console.log('App: Handled URL parameters, skipping path check')
    return
  }
  
  // Check if we should navigate to test view based on URL
  const currentPath = window.location.pathname
  if (currentPath === '/test') {
    console.log('App: Detected /test route, switching to test view')
    switchToTest()
  }
  
  // Listen for URL changes
  window.addEventListener('popstate', handleUrlChange)
  
})



// Cleanup
onUnmounted(() => {
  window.removeEventListener('popstate', handleUrlChange)
})
</script>

<template>
  <div class="max-w-[400px] bg-transparent w-full">
    <SecurityCheckView
      v-if="currentView === 'security-check'"
      @navigate-to-welcome="switchToWelcome"
      @navigate-to-authentication="handleSecurityCheckToAuth"
    />
    <WelcomeView 
      v-else-if="currentView === 'welcome'"
      @navigate-to-registration="switchToRegistration"
      @navigate-to-restore="switchToRestore"
    />
    <RegistrationView 
      v-else-if="currentView === 'registration'"
      @navigate-to-welcome="switchToWelcome"
      @navigate-to-seed-phase="switchToRegistrationSeedPhase"
    />
    <RegistrationSeedPhaseView 
      v-else-if="currentView === 'registration-seed-phase'"
      :email="userEmail"
      :username="userUsername"
      @navigate-to-registration="switchToRegistration"
      @navigate-to-security-check="switchToWelcome"
      @navigate-to-main="switchToMain"
    />
    <RestoreView 
      v-else-if="currentView === 'restore'"
      @navigate-to-welcome="switchToWelcome"
      @navigate-to-main="switchToMain"
    />
    <MainView 
      v-else-if="currentView === 'main'"
      :email="userEmail"
      :username="userUsername"
      @navigate-to-welcome="switchToWelcome"
      @navigate-to-settings="switchToSettings"
    />
    <SettingsView 
      v-else-if="currentView === 'settings'"
      @navigate-to-main="switchToMain"
      @navigate-to-welcome="switchToWelcome"
    />
    <AuthenticationView 
      v-else-if="currentView === 'authentication'"
      :source-url="authSourceUrl"
      :destination-url="authDestinationUrl"
      :request-id="authRequestId"
      @authorize-success="handleAuthSuccess"
      @authorize-error="handleAuthError"
      @cancel="handleAuthCancel"
      @navigate-to-security-check="switchToWelcome"
      @navigate-to-main="switchToMain"
      @navigate-to-behavior="switchToBehavior"
      @navigate-to-authentication-failed="handleAuthFailed"
    />
    <AuthenticationFailedView 
      v-else-if="currentView === 'authentication-failed'"
      :error-message="authErrorMessage"
      :request-id="authRequestId"
      @close="handleAuthFailedClose"
      @retry="() => switchToAuthentication(authSourceUrl, authDestinationUrl, authRequestId)"
      @navigate-to-welcome="switchToWelcome"
    />
    <BehaviorView 
      v-else-if="currentView === 'behavior'"
      :request-id="behaviorRequestId"
      :number-to-sign="behaviorNumberToSign"
      :source-url="authSourceUrl"
      :destination-url="authDestinationUrl"
      @behavior-success="handleBehaviorSuccess"
      @behavior-error="handleBehaviorError"
      @cancel="handleAuthCancel"
      @navigate-to-main="switchToMain"
      @navigate-to-authentication="() => switchToAuthentication(authSourceUrl, authDestinationUrl, authRequestId)"
      @navigate-to-biometric="switchToBiometric"
    />
    <BiometricView 
      v-else-if="currentView === 'biometric'"
      :request-id="biometricRequestId"
      :signature="biometricSignature"
      :source-url="biometricSourceUrl"
      :destination-url="biometricDestinationUrl"
      @biometric-success="handleBiometricSuccess"
      @biometric-error="handleBiometricError"
      @cancel="handleAuthCancel"
      @navigate-to-main="switchToMain"
      @navigate-to-behavior="() => switchToBehavior(biometricRequestId, behaviorNumberToSign)"
    />
    <TestView 
      v-else-if="currentView === 'test'"
      @go-back="switchToSecurityCheck"
    />
  </div>
</template>

<style scoped>
/* App-level styles */
</style>
