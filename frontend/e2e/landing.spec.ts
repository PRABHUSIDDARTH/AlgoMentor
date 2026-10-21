import { expect, test } from '@playwright/test'

test('landing input opens the problem in the workspace', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Problem number or statement' }).first().fill('1')
  await page.getByRole('button', { name: 'Start solving' }).first().click()
  await expect(page).toHaveURL(/\/app\?q=1$/)
  await expect(page.getByRole('heading', { level: 1, name: '1. Two Sum' })).toBeVisible()
})

test('the section nav reaches FAQ at the bottom of the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await page.getByRole('heading', { name: 'Questions, answered.' }).waitFor()
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(page.getByRole('banner').getByRole('link', { name: 'FAQ' })).toHaveAttribute('aria-current', 'page')
})
