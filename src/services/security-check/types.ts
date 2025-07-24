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
  certificatePinningStatus?: CertificatePinningStatus
  gdprComplianceStatus?: GDPRComplianceStatus
  threatDetectionStatus?: ThreatDetectionStatus
  soc2ComplianceStatus?: SOC2ComplianceStatus
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
  enableCertificatePinning: boolean
  enableGDPRCompliance: boolean
  enableThreatDetection: boolean
  enableSOC2Compliance: boolean
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

export interface CertificatePinningStatus {
  isPinned: boolean
  hasValidCertificate: boolean
  hasSecureConnection: boolean
  fingerprintVerified: boolean
  error?: string
}

export interface GDPRComplianceStatus {
  isCompliant: boolean
  hasDataMinimization: boolean
  hasConsentManagement: boolean
  hasDataPortability: boolean
  hasRightToErasure: boolean
  hasPrivacyByDesign: boolean
  error?: string
}

export interface ThreatDetectionStatus {
  isSecure: boolean
  hasAnomalyDetection: boolean
  hasBehavioralAnalysis: boolean
  hasThreatIntelligence: boolean
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  detectedThreats: string[]
  error?: string
}

export interface SOC2ComplianceStatus {
  isCompliant: boolean
  hasSecurityControls: boolean
  hasAvailabilityControls: boolean
  hasProcessingIntegrity: boolean
  hasConfidentialityControls: boolean
  hasPrivacyControls: boolean
  auditTrail: string[]
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
  CERTIFICATE_PINNING = 'certificate_pinning',
  GDPR_COMPLIANCE = 'gdpr_compliance',
  THREAT_DETECTION = 'threat_detection',
  SOC2_COMPLIANCE = 'soc2_compliance',
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
