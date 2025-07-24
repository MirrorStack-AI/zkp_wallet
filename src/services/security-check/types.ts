/**
 * Security Check Types and Interfaces
 * Defines all the core types used across the security check system
 */

export interface SecurityCheckState {
  isChecking: boolean
  currentStep: SecurityCheckStep
  progress: number
  error: string | null
  deviceFingerprint: string | null
  hsmStatus: HSMStatus
  biometricStatus: BiometricStatus
  zkpStatus: ZKPStatus
  cspStatus: CSPStatus
  tlsStatus: TLSStatus
  headersStatus: HeadersStatus
  cryptoStatus: CryptoStatus
  storageStatus: StorageStatus
  domSkimmingStatus: DOMSkimmingStatus
}

export interface SecurityCheckConfig {
  enableHSM: boolean
  enableBiometric: boolean
  enableDeviceFingerprinting: boolean
  enableZKP: boolean
  enableCSP: boolean
  enableTLS: boolean
  enableHeaders: boolean
  enableCrypto: boolean
  enableStorage: boolean
  enableDOMProtection: boolean
  timeoutMs: number
  retryAttempts: number
  delayMs: number
}

export interface HSMStatus {
  isAvailable: boolean
  isInitialized: boolean
  keyPairGenerated: boolean
  error?: string
}

export interface BiometricStatus {
  isAvailable: boolean
  isSupported: boolean
  isAuthenticated: boolean
  platform: 'windows' | 'macos' | 'linux' | 'unsupported'
  error?: string
}

export interface ZKPStatus {
  isReady: boolean
  challengeReceived: boolean
  proofGenerated: boolean
  isAuthenticated: boolean
  fallbackUsed?: boolean
  error?: string
}

export interface CSPStatus {
  isEnabled: boolean
  hasSecurePolicy: boolean
  hasFrameAncestors: boolean
  hasUnsafeInline: boolean
  hasUnsafeEval: boolean
  error?: string
}

export interface TLSStatus {
  isSecure: boolean
  hasHSTS: boolean
  hasSecureCookies: boolean
  hasValidCertificate: boolean
  error?: string
}

export interface HeadersStatus {
  hasXFrameOptions: boolean
  hasXContentTypeOptions: boolean
  hasReferrerPolicy: boolean
  hasPermissionsPolicy: boolean
  error?: string
}

export interface CryptoStatus {
  hasSecureRandom: boolean
  hasSubtleCrypto: boolean
  hasKeyGeneration: boolean
  hasEncryption: boolean
  error?: string
}

export interface StorageStatus {
  hasSecureStorage: boolean
  hasEncryptedStorage: boolean
  hasSessionStorage: boolean
  hasLocalStorage: boolean
  error?: string
}

export interface DOMSkimmingStatus {
  isProtected: boolean
  hasSensitiveDataInDOM: boolean
  hasSecureUIElements: boolean
  hasIsolatedStorage: boolean
  error?: string
}

export enum SecurityCheckStep {
  INITIALIZING = 'initializing',
  DEVICE_FINGERPRINTING = 'device_fingerprinting',
  HSM_VERIFICATION = 'hsm_verification',
  BIOMETRIC_CHECK = 'biometric_check',
  ZKP_INITIALIZATION = 'zkp_initialization',
  CSP_VALIDATION = 'csp_validation',
  TLS_CHECK = 'tls_check',
  HEADERS_CHECK = 'headers_check',
  CRYPTO_CHECK = 'crypto_check',
  STORAGE_CHECK = 'storage_check',
  DOM_PROTECTION = 'dom_protection',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface SecurityCheckResult {
  success: boolean
  data?: unknown
  error?: string
}

export interface SecurityCheckContext {
  config: SecurityCheckConfig
  state: SecurityCheckState
  step: SecurityCheckStep
  progress: number
}
