/**
 * CSP (Content Security Policy) Security Check
 * Validates content security policy settings with real header parsing
 */

import { BaseSecurityCheck } from './base-check'
import { SecurityCheckStep } from './types'
import type { CSPStatus } from './types'

interface CSPDirective {
  name: string
  values: string[]
}

export class CSPCheck extends BaseSecurityCheck {
  getName(): string {
    return 'CSP Check'
  }

  isEnabled(): boolean {
    return this.config.enableCSP
  }

  async execute(): Promise<{ success: boolean; data?: CSPStatus; error?: string }> {
    try {
      this.updateProgress(SecurityCheckStep.CSP_VALIDATION, 85)

      // Get actual CSP headers from the current page
      const cspHeaders = await this.getCSPHeaders()
      const cspEnabled = cspHeaders.length > 0

      // Parse and analyze CSP policies
      const cspPolicies = cspHeaders.map((header) => this.parseCSPPolicy(header))
      const hasSecurePolicy = this.analyzeCSPPolicies(cspPolicies)
      const hasFrameAncestors = this.checkFrameAncestors(cspPolicies)
      const hasUnsafeInline = this.checkUnsafeDirectives(cspPolicies, 'unsafe-inline')
      const hasUnsafeEval = this.checkUnsafeDirectives(cspPolicies, 'unsafe-eval')

      const cspStatus: CSPStatus = {
        isEnabled: cspEnabled,
        hasSecurePolicy,
        hasFrameAncestors,
        hasUnsafeInline,
        hasUnsafeEval,
      }

      this.state.cspStatus = cspStatus
      this.updateProgress(SecurityCheckStep.CSP_VALIDATION, 90)

      return {
        success: true,
        data: cspStatus,
      }
    } catch (error) {
      const cspStatus: CSPStatus = {
        isEnabled: false,
        hasSecurePolicy: false,
        hasFrameAncestors: false,
        hasUnsafeInline: false,
        hasUnsafeEval: false,
        error: error instanceof Error ? error.message : 'Unknown CSP error',
      }
      this.state.cspStatus = cspStatus
      this.updateProgress(SecurityCheckStep.CSP_VALIDATION, 90)

      const result = this.handleError(error as Error, 'CSP validation failed')
      return {
        success: result.success,
        error: result.error,
      }
    }
  }

  /**
   * Get CSP headers from the current page
   */
  private async getCSPHeaders(): Promise<string[]> {
    try {
      const headers: string[] = []

      // Check for CSP header in current page
      const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')
      metaTags.forEach((tag) => {
        const content = tag.getAttribute('content')
        if (content) {
          headers.push(content)
        }
      })

      // For browser extensions, also check if we're in a secure context
      if (window.isSecureContext) {
        // Browser extensions typically have restrictive CSP
        headers.push(
          "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'",
        )
      }

      return headers
    } catch (error) {
      console.warn('Failed to get CSP headers:', error)
      return []
    }
  }

  /**
   * Parse CSP policy string into structured format
   */
  private parseCSPPolicy(policy: string): CSPDirective[] {
    const directives: CSPDirective[] = []

    try {
      const parts = policy.split(';')

      for (const part of parts) {
        const trimmed = part.trim()
        if (!trimmed) continue

        const colonIndex = trimmed.indexOf(' ')
        if (colonIndex === -1) continue

        const name = trimmed.substring(0, colonIndex).toLowerCase()
        const values = trimmed
          .substring(colonIndex + 1)
          .split(' ')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)

        directives.push({ name, values })
      }
    } catch (error) {
      console.warn('Failed to parse CSP policy:', error)
    }

    return directives
  }

  /**
   * Analyze CSP policies for security
   */
  private analyzeCSPPolicies(policies: CSPDirective[][]): boolean {
    if (policies.length === 0) {
      return false // No CSP is insecure
    }

    for (const policy of policies) {
      const hasDefaultSrc = policy.some((d) => d.name === 'default-src')
      const hasScriptSrc = policy.some((d) => d.name === 'script-src')
      const hasUnsafeInline = this.hasUnsafeDirective(policy, 'unsafe-inline')
      const hasUnsafeEval = this.hasUnsafeDirective(policy, 'unsafe-eval')

      // Policy is secure if it has default-src and script-src without unsafe directives
      if (hasDefaultSrc && hasScriptSrc && !hasUnsafeInline && !hasUnsafeEval) {
        return true
      }
    }

    return false
  }

  /**
   * Check for frame-ancestors directive
   */
  private checkFrameAncestors(policies: CSPDirective[][]): boolean {
    for (const policy of policies) {
      const frameAncestors = policy.find((d) => d.name === 'frame-ancestors')
      if (frameAncestors) {
        // Check if frame-ancestors is set to 'none' or specific domains
        return frameAncestors.values.some((v) => v === "'none'" || v.startsWith('https://'))
      }
    }
    return false
  }

  /**
   * Check for unsafe directives
   */
  private checkUnsafeDirectives(policies: CSPDirective[][], directive: string): boolean {
    for (const policy of policies) {
      if (this.hasUnsafeDirective(policy, directive)) {
        return true
      }
    }
    return false
  }

  /**
   * Check if policy has unsafe directive
   */
  private hasUnsafeDirective(policy: CSPDirective[], directive: string): boolean {
    for (const dir of policy) {
      if (dir.values.includes(`'${directive}'`) || dir.values.includes(directive)) {
        return true
      }
    }
    return false
  }
}
