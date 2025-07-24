/**
 * Security Check Service - Main Entry Point
 *
 * This module provides a comprehensive security verification system for the MirrorStack Wallet
 * browser extension. It implements object-oriented design patterns with separate concerns
 * for different security checks.
 *
 * ## Architecture Overview
 *
 * The security check system is built using:
 * - **Object-Oriented Design**: Each security check extends `BaseSecurityCheck`
 * - **Separation of Concerns**: Individual checks are in separate files
 * - **Type Safety**: Full TypeScript support with strict typing
 * - **Error Handling**: Comprehensive error handling throughout
 * - **Configuration**: Flexible configuration system
 *
 * ## Security Checks Included
 *
 * 1. **Device Fingerprinting**: Privacy-focused device identification
 * 2. **HSM Verification**: Hardware Security Module capabilities
 * 3. **Biometric Authentication**: Platform biometric support
 * 4. **ZKP (Zero-Knowledge Proof)**: Cryptographic proof systems
 * 5. **CSP Validation**: Content Security Policy verification
 * 6. **TLS/HTTPS**: Transport layer security checks
 * 7. **Security Headers**: HTTP security header validation
 * 8. **Crypto API**: Cryptographic capabilities verification
 * 9. **Storage Security**: Secure storage capabilities
 * 10. **DOM Skimming Protection**: Protection against data skimming attacks
 *
 * ## Usage Examples
 *
 * ### Basic Usage
 * ```typescript
 * import { SecurityCheckService } from '@/services/security-check'
 *
 * const service = new SecurityCheckService({
 *   enableHSM: true,
 *   enableBiometric: true,
 *   enableDeviceFingerprinting: true,
 *   enableZKP: true,
 *   enableCSP: true,
 *   enableTLS: true,
 *   enableHeaders: true,
 *   enableCrypto: true,
 *   enableStorage: true,
 *   enableDOMProtection: true,
 *   timeoutMs: 30000,
 *   retryAttempts: 3
 * })
 *
 * const result = await service.startSecurityCheck()
 * console.log('Security Status:', service.getSecurityStatus())
 * ```
 *
 * ### Advanced Usage with Progress Tracking
 * ```typescript
 * const service = new SecurityCheckService(config)
 *
 * // Start progress simulation for UI feedback
 * service.startProgressSimulation((progress) => {
 *   console.log(`Progress: ${progress}%`)
 * })
 *
 * const result = await service.startSecurityCheck()
 * service.stopProgressSimulation()
 * ```
 *
 * ### Configuration Management
 * ```typescript
 * // Update configuration
 * service.updateConfig({
 *   enableHSM: false,
 *   timeoutMs: 15000
 * })
 *
 * // Get current configuration
 * const config = service.getConfig()
 *
 * // Reset state
 * service.reset()
 * ```
 *
 * ## File Structure
 *
 * ```
 * security-check/
 * ├── index.ts                    # Main service file (this file)
 * ├── types.ts                    # TypeScript interfaces and types
 * ├── base-check.ts               # Abstract base class for all checks
 * ├── security-check-orchestrator.ts # Main orchestrator
 * ├── device-fingerprint-check.ts # Device fingerprinting
 * ├── hsm-check.ts               # Hardware Security Module
 * ├── biometric-check.ts         # Biometric authentication
 * ├── zkp-check.ts              # Zero-Knowledge Proof
 * ├── csp-check.ts              # Content Security Policy
 * ├── tls-check.ts              # TLS/HTTPS security
 * ├── headers-check.ts          # Security headers
 * ├── crypto-check.ts           # Cryptographic API
 * ├── storage-check.ts          # Storage security
 * └── dom-skimming-check.ts    # DOM skimming protection
 * ```
 *
 * ## Security Features
 *
 * - **Privacy-First**: Minimal device data collection
 * - **Error Resilience**: Graceful handling of failures
 * - **Configuration Validation**: Input validation for all parameters
 * - **Memory Management**: Proper cleanup of resources
 * - **Type Safety**: Full TypeScript support
 * - **Extensible**: Easy to add new security checks
 * - **DOM Protection**: Protection against data skimming attacks
 *
 * ## Error Handling
 *
 * The service provides comprehensive error handling:
 * - Individual check failures don't stop the entire process
 * - Detailed error messages for debugging
 * - Graceful degradation when features are unavailable
 * - Proper state management during errors
 *
 * ## Performance Considerations
 *
 * - Sequential execution to avoid overwhelming the system
 * - Configurable delays between checks
 * - Progress simulation for UI feedback
 * - Memory-efficient state management
 * - Proper cleanup of intervals and resources
 *
 * @module SecurityCheckService
 */

export { SecurityCheckOrchestrator as SecurityCheckService } from './security-check-orchestrator'
export type {
  SecurityCheckConfig,
  SecurityCheckState,
  SecurityCheckStep,
  SecurityCheckResult,
  SecurityCheckContext,
  HSMStatus,
  BiometricStatus,
  ZKPStatus,
  CSPStatus,
  TLSStatus,
  HeadersStatus,
  CryptoStatus,
  StorageStatus,
  DOMSkimmingStatus,
} from './types'

// Re-export the main service class for backward compatibility
export { SecurityCheckOrchestrator } from './security-check-orchestrator'

// Export individual check classes for advanced usage
export { DeviceFingerprintCheck } from './device-fingerprint-check'
export { HSMCheck } from './hsm-check'
export { BiometricCheck } from './biometric-check'
export { ZKPCheck } from './zkp-check'
export { CSPCheck } from './csp-check'
export { TLSCheck } from './tls-check'
export { HeadersCheck } from './headers-check'
export { CryptoCheck } from './crypto-check'
export { StorageCheck } from './storage-check'
export { DOMSkimmingCheck } from './dom-skimming-check'
export { BaseSecurityCheck } from './base-check'
