import { expect, test } from '@playwright/test'

test('dark theme persists across reloads without a flash', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).not.toHaveClass(/dark/)
  const toggle = page.getByRole('button', { name: 'Theme' })
  // Two themes only: one click switches light to dark.
  await toggle.click()
  await expect(html).toHaveClass(/dark/)
  await page.reload({ waitUntil: 'domcontentloaded' })
  // The inline script in <head> applies the class before the app's JS runs.
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true)
})
