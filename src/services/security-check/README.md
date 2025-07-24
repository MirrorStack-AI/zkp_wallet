# Security Check Service

A comprehensive, object-oriented security verification system for the MirrorStack Wallet browser extension.

## Overview

This service provides a modular, extensible security checking system that verifies various security aspects of the browser environment. It's built using TypeScript with strict typing and follows object-oriented design principles.

## Architecture

### Core Components

- **`BaseSecurityCheck`**: Abstract base class that all security checks extend
- **`SecurityCheckOrchestrator`**: Main orchestrator that manages all checks
- **Individual Check Classes**: Each security aspect has its own class

### Design Principles

- **Separation of Concerns**: Each security check is in its own file
- **Object-Oriented Design**: All checks extend `BaseSecurityCheck`
- **Type Safety**: Full TypeScript support with strict typing
- **Error Resilience**: Graceful handling of individual check failures
- **Extensibility**: Easy to add new security checks

## Security Checks

### 1. Device Fingerprinting (`device-fingerprint-check.ts`)

- Privacy-focused device identification
- Collects minimal, non-sensitive data
- Generates SHA-256 hash of device characteristics
- Checks for privacy features (Do Not Track, cookies, etc.)

### 2. HSM Verification (`hsm-check.ts`)

- Hardware Security Module capabilities
- Tests Web Crypto API availability
- Verifies key generation capabilities
- Tests encryption/decryption functions

### 3. Biometric Authentication (`biometric-check.ts`)

- Platform biometric support detection
- WebAuthn API verification
- Platform-specific capabilities
- User verification availability

### 4. ZKP (Zero-Knowledge Proof) (`zkp-check.ts`)

- Cryptographic proof system initialization
- Challenge-response simulation
- Proof generation capabilities
- Authentication verification

### 5. CSP Validation (`csp-check.ts`)

- Content Security Policy verification
- Policy content analysis
- Security directive checking
- Unsafe directive detection

### 6. TLS/HTTPS (`tls-check.ts`)

- Transport layer security verification
- Secure context validation
- HSTS (HTTP Strict Transport Security) checking
- Certificate validity verification

### 7. Security Headers (`headers-check.ts`)

- HTTP security header validation
- X-Frame-Options checking
- X-Content-Type-Options verification
- Referrer Policy validation

### 8. Crypto API (`crypto-check.ts`)

- Cryptographic capabilities verification
- Secure random number generation
- Subtle crypto API availability
- Key generation and encryption testing

### 9. Storage Security (`storage-check.ts`)

- Secure storage capabilities
- Encrypted storage availability
- Session and local storage verification
- Crypto-backed storage validation

## Usage

### Basic Usage

```typescript
import { SecurityCheckService } from '@/services/security-check'

const service = new SecurityCheckService({
  enableHSM: true,
  enableBiometric: true,
  enableDeviceFingerprinting: true,
  enableZKP: true,
  enableCSP: true,
  enableTLS: true,
  enableHeaders: true,
  enableCrypto: true,
  enableStorage: true,
  timeoutMs: 30000,
  retryAttempts: 3,
})

const result = await service.startSecurityCheck()
console.log('Security Status:', service.getSecurityStatus())
```

### Advanced Usage

```typescript
// Progress tracking
service.startProgressSimulation((progress) => {
  console.log(`Progress: ${progress}%`)
})

const result = await service.startSecurityCheck()
service.stopProgressSimulation()

// Configuration management
service.updateConfig({
  enableHSM: false,
  timeoutMs: 15000,
})

// State management
const state = service.getState()
const config = service.getConfig()
service.reset()
```

### Individual Check Usage

```typescript
import { DeviceFingerprintCheck } from '@/services/security-check'

const check = new DeviceFingerprintCheck(config, state)
const result = await check.execute()
```

## Configuration

### SecurityCheckConfig

```typescript
interface SecurityCheckConfig {
  enableHSM: boolean // Hardware Security Module
  enableBiometric: boolean // Biometric authentication
  enableDeviceFingerprinting: boolean // Device fingerprinting
  enableZKP: boolean // Zero-Knowledge Proof
  enableCSP: boolean // Content Security Policy
  enableTLS: boolean // TLS/HTTPS security
  enableHeaders: boolean // Security headers
  enableCrypto: boolean // Cryptographic API
  enableStorage: boolean // Storage security
  timeoutMs: number // Timeout in milliseconds (1000-60000)
  retryAttempts: number // Retry attempts (0-10)
}
```

## State Management

### SecurityCheckState

The service maintains a comprehensive state object that tracks:

- Current step and progress
- Error messages
- Individual check results
- Overall security status

## Error Handling

The service provides comprehensive error handling:

- Individual check failures don't stop the entire process
- Detailed error messages for debugging
- Graceful degradation when features are unavailable
- Proper state management during errors

## Performance Considerations

- Sequential execution to avoid overwhelming the system
- Configurable delays between checks
- Progress simulation for UI feedback
- Memory-efficient state management
- Proper cleanup of intervals and resources

## Security Features

- **Privacy-First**: Minimal device data collection
- **Error Resilience**: Graceful handling of failures
- **Configuration Validation**: Input validation for all parameters
- **Memory Management**: Proper cleanup of resources
- **Type Safety**: Full TypeScript support
- **Extensible**: Easy to add new security checks

## File Structure

```
security-check/
├── index.ts                    # Main service file with documentation
├── types.ts                    # TypeScript interfaces and types
├── base-check.ts               # Abstract base class for all checks
├── security-check-orchestrator.ts # Main orchestrator
├── device-fingerprint-check.ts # Device fingerprinting
├── hsm-check.ts               # Hardware Security Module
├── biometric-check.ts         # Biometric authentication
├── zkp-check.ts              # Zero-Knowledge Proof
├── csp-check.ts              # Content Security Policy
├── tls-check.ts              # TLS/HTTPS security
├── headers-check.ts          # Security headers
├── crypto-check.ts           # Cryptographic API
├── storage-check.ts          # Storage security
└── README.md                 # This file
```

## Adding New Security Checks

To add a new security check:

1. Create a new file following the naming convention: `{check-name}-check.ts`
2. Extend the `BaseSecurityCheck` class
3. Implement the required abstract methods:
   - `execute()`: Perform the security check
   - `getName()`: Return the check name
   - `isEnabled()`: Check if enabled in config
4. Add the check to the orchestrator's `initializeChecks()` method
5. Update the types if needed

Example:

```typescript
export class NewSecurityCheck extends BaseSecurityCheck {
  getName(): string {
    return 'New Security Check'
  }

  isEnabled(): boolean {
    return this.config.enableNewCheck
  }

  async execute(): Promise<{ success: boolean; data?: any; error?: string }> {
    // Implementation
  }
}
```

## Testing

Each security check can be tested independently:

```typescript
import { DeviceFingerprintCheck } from '@/services/security-check'

const check = new DeviceFingerprintCheck(config, state)
const result = await check.execute()
expect(result.success).toBe(true)
```

## Migration from Legacy Service

The old monolithic `SecurityCheckService` has been replaced with this modular system. For backward compatibility, the old service now extends the new orchestrator.

**For new code, prefer importing from `@/services/security-check` directly.**

## Contributing

When contributing to this service:

1. Follow the existing code structure
2. Add comprehensive TypeScript types
3. Include proper error handling
4. Add JSDoc comments
5. Test thoroughly
6. Update this README if needed
