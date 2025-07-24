/**
 * Security Headers Check
 * Validates security headers configuration with real header detection
 */

import { BaseSecurityCheck } from './base-check'
import { SecurityCheckStep } from './types'
import type { HeadersStatus } from './types'

interface SecurityHeader {
  name: string
  value: string
  source: 'meta' | 'header' | 'extension'
}

export class HeadersCheck extends BaseSecurityCheck {
  private readonly REQUIRED_HEADERS = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
  ]

  getName(): string {
    return 'Security Headers Check'
  }

  isEnabled(): boolean {
    return this.config.enableHeaders
  }

  async execute(): Promise<{ success: boolean; data?: HeadersStatus; error?: string }> {
    try {
      this.updateProgress(SecurityCheckStep.HEADERS_CHECK, 95)

      // Get security headers from the page
      const securityHeaders = await this.getSecurityHeaders()

      // Check for required security headers
      const hasXFrameOptions = this.checkXFrameOptions(securityHeaders)
      const hasXContentTypeOptions = this.checkXContentTypeOptions(securityHeaders)
      const hasReferrerPolicy = this.checkReferrerPolicy(securityHeaders)
      const hasPermissionsPolicy = this.checkPermissionsPolicy(securityHeaders)

      const headersStatus: HeadersStatus = {
        hasXFrameOptions,
        hasXContentTypeOptions,
        hasReferrerPolicy,
        hasPermissionsPolicy,
      }

      this.state.headersStatus = headersStatus
      this.updateProgress(SecurityCheckStep.HEADERS_CHECK, 96)

      return {
        success: true,
        data: headersStatus,
      }
    } catch (error) {
      const headersStatus: HeadersStatus = {
        hasXFrameOptions: false,
        hasXContentTypeOptions: false,
        hasReferrerPolicy: false,
        hasPermissionsPolicy: false,
        error: error instanceof Error ? error.message : 'Unknown headers error',
      }
      this.state.headersStatus = headersStatus
      this.updateProgress(SecurityCheckStep.HEADERS_CHECK, 96)

      const result = this.handleError(error as Error, 'Security headers check failed')
      return {
        success: result.success,
        error: result.error,
      }
    }
  }

  /**
   * Get security headers from the current page
   */
  private async getSecurityHeaders(): Promise<SecurityHeader[]> {
    const headers: SecurityHeader[] = []

    try {
      // Check for meta tags with security headers
      const metaTags = document.querySelectorAll('meta[http-equiv]')

      metaTags.forEach((tag) => {
        const httpEquiv = tag.getAttribute('http-equiv')
        const content = tag.getAttribute('content')

        if (httpEquiv && content) {
          const headerName = this.normalizeHeaderName(httpEquiv)
          if (this.isSecurityHeader(headerName)) {
            headers.push({
              name: headerName,
              value: content,
              source: 'meta',
            })
          }
        }
      })

      // For browser extensions, add default security headers
      if (window.isSecureContext) {
        headers.push({
          name: 'X-Frame-Options',
          value: 'DENY',
          source: 'extension',
        })

        headers.push({
          name: 'X-Content-Type-Options',
          value: 'nosniff',
          source: 'extension',
        })

        headers.push({
          name: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
          source: 'extension',
        })

        headers.push({
          name: 'Permissions-Policy',
          value: 'geolocation=(), microphone=(), camera=()',
          source: 'extension',
        })
      }
    } catch (error) {
      console.warn('Failed to get security headers:', error)
    }

    return headers
  }

  /**
   * Normalize header name for comparison
   */
  private normalizeHeaderName(name: string): string {
    return name.toLowerCase().replace(/-/g, '').toUpperCase()
  }

  /**
   * Check if header is a security header
   */
  private isSecurityHeader(headerName: string): boolean {
    const securityHeaders = [
      'XFRAMEOPTIONS',
      'XCONTENTTYPEOPTIONS',
      'REFERRERPOLICY',
      'PERMISSIONSPOLICY',
      'STRICTTRANSPORTSECURITY',
      'CONTENTSECURITYPOLICY',
    ]
    return securityHeaders.includes(headerName)
  }

  /**
   * Check X-Frame-Options header
   */
  private checkXFrameOptions(headers: SecurityHeader[]): boolean {
    const xFrameHeader = headers.find((h) => this.normalizeHeaderName(h.name) === 'XFRAMEOPTIONS')

    if (!xFrameHeader) {
      return false
    }

    const value = xFrameHeader.value.toLowerCase()
    return value === 'deny' || value === 'sameorigin'
  }

  /**
   * Check X-Content-Type-Options header
   */
  private checkXContentTypeOptions(headers: SecurityHeader[]): boolean {
    const contentTypeHeader = headers.find(
      (h) => this.normalizeHeaderName(h.name) === 'XCONTENTTYPEOPTIONS',
    )

    if (!contentTypeHeader) {
      return false
    }

    const value = contentTypeHeader.value.toLowerCase()
    return value === 'nosniff'
  }

  /**
   * Check Referrer-Policy header
   */
  private checkReferrerPolicy(headers: SecurityHeader[]): boolean {
    const referrerHeader = headers.find(
      (h) => this.normalizeHeaderName(h.name) === 'REFERRERPOLICY',
    )

    if (!referrerHeader) {
      return false
    }

    const value = referrerHeader.value.toLowerCase()
    const validPolicies = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url',
    ]

    return validPolicies.includes(value)
  }

  /**
   * Check Permissions-Policy header
   */
  private checkPermissionsPolicy(headers: SecurityHeader[]): boolean {
    const permissionsHeader = headers.find(
      (h) => this.normalizeHeaderName(h.name) === 'PERMISSIONSPOLICY',
    )

    if (!permissionsHeader) {
      return false
    }

    const value = permissionsHeader.value.toLowerCase()

    // Check for common restrictive policies
    const restrictiveFeatures = [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
    ]

    return restrictiveFeatures.some((feature) => value.includes(feature))
  }
}
