import { test, expect } from '@playwright/test'

/**
 * Animation Test for Security Checking
 * Tests the animated ellipsis effect on the security checking title
 */

test.describe('Security Checking Animation Tests', () => {
  test('should display animated security checking title', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load completely
    await page.waitForLoadState('domcontentloaded')

    // Verify the security checking title is visible
    await expect(page.locator('[data-testid="security-checking-title"]')).toBeVisible()

    // Verify the title text is correct
    await expect(page.locator('[data-testid="security-checking-title"]')).toHaveText(
      'Security Checking',
    )

    // Verify the animated dots container is visible
    await expect(page.locator('[data-testid="security-checking-dots"]')).toBeVisible()

    // Verify the dots are present (should be 3 dots)
    const dots = page.locator('[data-testid="security-checking-dots"] .dot')
    await expect(dots).toHaveCount(3)

    // Verify each dot contains a period
    for (let i = 0; i < 3; i++) {
      await expect(dots.nth(i)).toHaveText('.')
    }
  })

  test('should have proper animation styling', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load completely
    await page.waitForLoadState('domcontentloaded')

    // Check that the animation CSS classes are applied
    const dotsContainer = page.locator('[data-testid="security-checking-dots"]')
    await expect(dotsContainer).toHaveClass(/animate-ellipsis/)

    // Check that individual dots have the dot class
    const dots = page.locator('[data-testid="security-checking-dots"] .dot')
    for (let i = 0; i < 3; i++) {
      await expect(dots.nth(i)).toHaveClass(/dot/)
    }
  })

  test('should maintain animation during security check', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load completely
    await page.waitForLoadState('domcontentloaded')

    // Wait for security check to start
    await expect(page.locator('[data-testid="security-check-view"]')).toBeVisible()

    // Verify animation elements remain visible during the check
    await expect(page.locator('[data-testid="security-checking-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="security-checking-dots"]')).toBeVisible()

    // Wait a bit to ensure animation continues
    await page.waitForTimeout(2000)

    // Verify elements are still visible after animation time
    await expect(page.locator('[data-testid="security-checking-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="security-checking-dots"]')).toBeVisible()
  })
})
