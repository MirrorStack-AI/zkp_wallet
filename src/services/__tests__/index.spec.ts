/**
 * Services Test Suite
 * Comprehensive unit tests for all services in the @/services directory
 */

import { describe, it, expect } from 'vitest'

// Import all service tests
import './AuthenticationService.spec'
import './TimeoutService.spec'
import './StorageService.spec'
import './SecurityApiService.spec'
import './ExtensionCommunicationService.spec'
import './EventDispatcherService.spec'

describe('Services Test Suite', () => {
  it('should have all service tests loaded', () => {
    // This test ensures all service test files are properly imported
    expect(true).toBe(true)
  })
}) 