import { test, expect } from '@playwright/test'

test('loads a profile and updates signature when a badge is toggled', async ({ page }) => {
  await page.goto('/profile/thomas-jung')

  // Profile populates (avatar + name)
  await expect(page.locator('.user-chip')).toBeVisible({ timeout: 15_000 })

  // At least one badge row appears in the table
  const rows = page.locator('[data-testid=badge-table] tbody tr')
  await expect(rows.first()).toBeVisible()

  // Capture the initial signature URL
  const sigImg = page.locator('[data-testid=preview-full]')
  const initialSrc = await sigImg.getAttribute('src')
  expect(initialSrc).toContain('/showcaseBadgesGroups/thomas-jung')

  // Toggle the first checkbox of an unselected row, then verify URL changed
  const firstUnselectedCb = page.locator('ui5-checkbox:not([checked])').first()
  await firstUnselectedCb.click({ force: true })

  await expect.poll(async () => sigImg.getAttribute('src')).not.toBe(initialSrc)
})
