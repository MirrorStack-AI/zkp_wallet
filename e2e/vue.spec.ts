import { test, expect } from '@playwright/test'

/**
 * Vue Application Tests
 * Tests the basic Vue application functionality
 */

test.describe('Vue Application Tests', () => {
  test('visits the app root url', async ({ page, browserName }) => {
    // Add retry logic for Firefox connection issues
    let retries = 3
    while (retries > 0) {
      try {
        await page.goto('/', {
          waitUntil: 'domcontentloaded',
          timeout: browserName === 'firefox' ? 60000 : 30000, // Longer timeout for Firefox
        })

        // Add Firefox-specific wait time
        if (browserName === 'firefox') {
          await page.waitForTimeout(3000)
        }

        break
      } catch (error) {
        retries--
        if (retries === 0) {
          throw error
        }
        // Wait a bit before retrying
        await page.waitForTimeout(2000)
      }
    }

    // Verify the page loads correctly - wait for welcome view instead
    await page.waitForSelector('[data-testid="welcome-view"]', { timeout: 15000 })
  })

  test('displays main heading', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the welcome view to load
    await page.waitForSelector('[data-testid="welcome-view"]', { timeout: 15000 })

    // Check that the main heading is present - it should be "MirrorStack Wallet"
    await expect(page.locator('h1')).toHaveText('MirrorStack Wallet')
  })

  test('shows logo', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the welcome view to load
    await page.waitForSelector('[data-testid="welcome-view"]', { timeout: 15000 })

    // Check that logo is present - look for the logo
    const logo = page.locator('[data-testid="logo"]')
    await expect(logo).toBeVisible()
  })

  test('shows description text', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the welcome view to load
    await page.waitForSelector('[data-testid="welcome-view"]', { timeout: 15000 })

    // Check that description text is present - look for welcome subtitle
    await expect(page.locator('[data-testid="welcome-subtitle"]')).toContainText(
      'Welcome to MirrorStack Wallet',
    )
  })

  test('has theme toggle', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the welcome view to load
    await page.waitForSelector('[data-testid="welcome-view"]', { timeout: 15000 })

    // Check that theme toggle is present
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    await expect(themeToggle).toBeVisible()
  })
})
