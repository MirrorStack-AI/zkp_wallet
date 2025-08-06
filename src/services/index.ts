/**
 * Services Index
 * Exports all services for easy importing
 */

// Core services
export { default as AuthenticationService } from './AuthenticationService'
export { default as TimeoutService } from './TimeoutService'
export { default as ExtensionCommunicationService } from './ExtensionCommunicationService'
export { default as StorageService } from './StorageService'

// Security services
export { default as SecurityApiService } from './SecurityApiService'

// Security check services
export * from './security-check'

// Types
export type {
  AuthenticationRequest,
  AuthenticationResponse,
  AuthenticationStatus,
  TimeoutConfig
} from './AuthenticationService'
export type {
  TimeoutConfig as TimeoutServiceConfig,
  TimeoutState as TimeoutServiceState,
  TimeoutCallback as TimeoutServiceCallback
} from './TimeoutService'
export type {
  ExtensionMessage as ExtensionCommunicationMessage,
  ExtensionResponse as ExtensionCommunicationResponse,
  StorageData as ExtensionStorageData,
  ExtensionConfig as ExtensionCommunicationConfig,
  BrowserType as ExtensionBrowserType
} from './ExtensionCommunicationService'
export type {
  StorageConfig as StorageServiceConfig,
  StorageData as StorageServiceData,
  StorageOptions as StorageServiceOptions
} from './StorageService' 