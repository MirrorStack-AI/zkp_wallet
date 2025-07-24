import { test, expect } from '@playwright/test'

/**
 * Vue Application Basic Tests
 * Tests the basic functionality of the Vue application
 */

test.describe('Vue Application Tests', () => {
  test('visits the app root url', async ({ page }) => {
    await page.goto('/')

    // Basic page load test
    await expect(page).toHaveTitle(/Mirror Stack/)
  })

  test('shows security check interface', async ({ page }) => {
    await page.goto('/')

    // Check that the security check view is loaded
    await expect(page.locator('[data-testid="security-check-view"]')).toBeVisible()
  })

  test('displays main heading', async ({ page }) => {
    await page.goto('/')

    // Check that the main heading is present
    await expect(page.locator('h1')).toHaveText('Security Checking...')
  })

  test('shows logo', async ({ page }) => {
    await page.goto('/')

    // Check that logo is present
    const logo = page.locator('[data-testid="logo"]')
    await expect(logo).toBeVisible()
  })

  test('shows description text', async ({ page }) => {
    await page.goto('/')

    // Check that description text is present - use first p element
    await expect(page.locator('p').first()).toContainText(
      'Verifying your device for enhanced security',
    )
  })

  test('has theme toggle', async ({ page }) => {
    await page.goto('/')

    // Check that theme toggle is present
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    await expect(themeToggle).toBeVisible()
  })
})
