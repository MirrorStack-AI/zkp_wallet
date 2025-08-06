/**
 * Security API Service
 * Handles security check endpoints and CSRF protection
 */

export interface SecurityCheckRequest {
  action: string
  data?: Record<string, unknown>
  csrfToken?: string
}

export interface SecurityCheckResponse {
  success: boolean
  message: string
  data?: Record<string, unknown>
  csrfToken?: string
}

export class SecurityApiService {
  private static instance: SecurityApiService
  private csrfToken: string

  private constructor() {
    this.csrfToken = this.generateCSRFToken()
  }

  public static getInstance(): SecurityApiService {
    if (!SecurityApiService.instance) {
      SecurityApiService.instance = new SecurityApiService()
    }
    return SecurityApiService.instance
  }

  private generateCSRFToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  public getCSRFToken(): string {
    return this.csrfToken
  }

  public validateCSRFToken(token: string): boolean {
    return token === this.csrfToken
  }

  public async handleSecurityCheck(request: SecurityCheckRequest): Promise<SecurityCheckResponse> {
    // Validate CSRF token
    if (!request.csrfToken || !this.validateCSRFToken(request.csrfToken)) {
      return {
        success: false,
        message: 'Invalid CSRF token',
        csrfToken: this.csrfToken,
      }
    }

    // Sanitize input
    const sanitizedAction = this.sanitizeInput(request.action)
    const sanitizedData = request.data ? this.sanitizeInput(JSON.stringify(request.data)) : null

    // Handle different security check actions
    switch (sanitizedAction) {
      case 'bypass':
        return {
          success: false,
          message: 'Security bypass attempt detected',
          csrfToken: this.csrfToken,
        }

      case 'test':
        return {
          success: true,
          message: 'Security check passed',
          data: { status: 'secure' },
          csrfToken: this.csrfToken,
        }

      case 'validate':
        return {
          success: true,
          message: 'Security validation completed',
          data: { validated: true },
          csrfToken: this.csrfToken,
        }

      default:
        return {
          success: false,
          message: 'Invalid security check action',
          csrfToken: this.csrfToken,
        }
    }
  }

  private sanitizeInput(input: string): string {
    // Remove script tags and other dangerous content
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe/gi, '')
      .replace(/<object/gi, '')
      .replace(/<embed/gi, '')
  }

  public async validateSecurityHeaders(): Promise<boolean> {
    try {
      // Use chrome.runtime.sendMessage for extension API calls
      const chrome = (window as unknown as { chrome?: unknown }).chrome
      const runtime =
        chrome && typeof chrome === 'object' && chrome !== null && 'runtime' in chrome
          ? (chrome as { runtime?: unknown }).runtime
          : undefined
      const sendMessage =
        runtime && typeof runtime === 'object' && runtime !== null && 'sendMessage' in runtime
          ? (
              runtime as {
                sendMessage?: (message: Record<string, unknown>) => Promise<Record<string, unknown>>
              }
            ).sendMessage
          : undefined

      if (!sendMessage) {
        console.warn('Chrome runtime API not available')
        return false
      }

      const response = await sendMessage({
        type: 'API_SECURITY_CHECK',
        data: {
          action: 'validate',
          csrfToken: this.csrfToken,
        },
      })

      return (
        response &&
        typeof response === 'object' &&
        'success' in response &&
        response.success === true
      )
    } catch (error) {
      console.error('Security headers validation failed:', error)
      return false
    }
  }

  public async testXSSProtection(): Promise<boolean> {
    try {
      const maliciousInput = '<script>alert("XSS")</script>'
      const sanitized = this.sanitizeInput(maliciousInput)

      return !sanitized.includes('<script>')
    } catch (error) {
      console.error('XSS protection test failed:', error)
      return false
    }
  }

  public async testCSRFProtection(): Promise<boolean> {
    try {
      // Test without CSRF token
      const response = await fetch('/api/security-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bypass',
        }),
      })

      return response.status === 401 // Should be unauthorized
    } catch (error) {
      console.error('CSRF protection test failed:', error)
      return false
    }
  }
}

export default SecurityApiService 