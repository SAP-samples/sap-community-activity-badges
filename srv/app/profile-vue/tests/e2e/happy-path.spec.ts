/**
 * End-to-end happy-path + not-found tests for the Profile SPA.
 *
 * Mocking strategy: every request to /khoros/user/* is intercepted by
 * Playwright's page.route() and answered from a local JSON fixture. This
 * makes the test deterministic and fast — no dependency on the live
 * SAP Community Khoros API, no flaky timing.
 *
 * Selectors use data-testid attributes (not CSS classes) so refactors to
 * styling don't silently break the tests.
 */
import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Reuse the unit-test fixture so the contract stays in one place.
const happyFixture = JSON.parse(
  readFileSync(resolve(__dirname, '../unit/fixtures/khoros-user.json'), 'utf8')
)
const notFoundFixture = JSON.parse(
  readFileSync(resolve(__dirname, 'fixtures/khoros-user-not-found.json'), 'utf8')
)

test('loads a profile and updates signature when a badge is toggled', async ({ page }) => {
  // Mock /khoros/user/* — answer with the happy fixture for any SCN ID.
  await page.route('**/khoros/user/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(happyFixture)
    })
  })

  await page.goto('/profile/demo_user')

  // Profile populated (avatar chip visible, name shown).
  await expect(page.getByTestId('user-chip')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('user-name')).toContainText('Demo User')

  // Badge table rendered with the fixture's badges.
  const badgeTable = page.getByTestId('badge-table')
  await expect(badgeTable).toBeVisible()
  await expect(badgeTable).toContainText('CAP Champion')
  await expect(badgeTable).toContainText('Five Year Member')

  // Initial signature URL is set from the fixture's signature HTML
  // (cap-champion, devtoberfest-2025, first-blog).
  const sigImg = page.getByTestId('preview-full')
  const initialSrc = await sigImg.getAttribute('src')
  expect(initialSrc).toContain('/showcaseBadgesGroups/demo_user/')
  expect(initialSrc).toContain('cap-champion')

  // Toggle the unselected "five-year" badge — the URL should add it.
  await page.getByTestId('badge-cb-five-year').click({ force: true })
  await expect.poll(async () => sigImg.getAttribute('src')).toContain('five-year')
})

test('shows "user not found" banner when the SCN ID is unknown', async ({ page }) => {
  await page.route('**/khoros/user/*', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify(notFoundFixture)
    })
  })

  await page.goto('/profile/ghost')

  // Error banner visible with the localized "not found" message.
  await expect(page.getByTestId('error-banner')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId('error-banner')).toContainText("ghost")
  await expect(page.getByTestId('error-banner')).toContainText('not found')

  // Profile chip not rendered.
  await expect(page.getByTestId('user-chip')).toHaveCount(0)
})
