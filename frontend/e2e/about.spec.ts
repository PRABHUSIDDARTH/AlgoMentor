import { expect, test } from '@playwright/test'

const PROFILE = { name: 'Ana Gomez', github: 'demo', leetcode: 'demo', linkedin: 'ana-gomez', target: { company: 'maang', role: 'sde1', employer: 'google', focus: 'backend' }, dailyGoal: 3 }

test.beforeEach(async ({ page }) => {
  await page.addInitScript((p) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('algomentor.profile.v1', JSON.stringify(p)); sessionStorage.setItem('seeded', '1') } }, PROFILE)
})

test('About shows the dream ID, the readiness for the company and the live profiles', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('img', { name: /Dream ID for Ana Gomez: aspiring SDE-1 at Google/ })).toBeVisible()
  await expect(page.getByRole('meter', { name: 'Readiness for Google SDE-1' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Next steps' }).getByRole('listitem').first()).toBeVisible()
  // The demo profile is read live on open.
  await expect(page.getByRole('region', { name: 'GitHub' })).toContainText('12 public repos · 48 stars · 30 followers')
  await expect(page.getByRole('region', { name: 'LeetCode' })).toContainText('312 solved')
  await expect(page.getByRole('link', { name: /linkedin.com\/in\/ana-gomez/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/ana-gomez')
})

test('the card hangs from the Lanyard (or shows still when WebGL is unavailable)', async ({ page }) => {
  await page.goto('/about')
  const card = page.getByRole('img', { name: /Dream ID for/ })
  await expect(card.locator('canvas, img').first()).toBeVisible({ timeout: 15_000 })
})

test('Share on LinkedIn opens the composer with a goal, and downloads the card', async ({ page }) => {
  await page.addInitScript(() => { (window as unknown as { __opened: string[] }).__opened = []; window.open = ((u: string) => { (window as unknown as { __opened: string[] }).__opened.push(String(u)); return null }) as typeof window.open })
  await page.goto('/about')
  await expect(page.getByRole('img', { name: /Dream ID for/ })).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Share on LinkedIn' }).click()
  expect((await download).suggestedFilename()).toBe('my-dream-id.png')
  const opened = await page.evaluate(() => (window as unknown as { __opened: string[] }).__opened)
  expect(opened).toHaveLength(1)
  const url = new URL(opened[0])
  expect(url.hostname).toBe('www.linkedin.com')
  expect(url.searchParams.get('text')).toContain('working toward an SDE-1 role at Google')
  await expect(page.getByRole('status')).toContainText('Attach my-dream-id.png')
})

test('the settings page sets a dream company from the whole directory', async ({ page }) => {
  await page.goto('/about/settings')
  await page.getByRole('combobox', { name: 'Dream company' }).fill('flip')
  await page.getByRole('option', { name: /Flipkart/ }).click()
  await expect(page.getByText('Dream company: Flipkart')).toBeVisible()
  await page.getByRole('link', { name: 'Profile', exact: true }).click()
  await expect(page.getByRole('img', { name: /aspiring SDE-1 at Flipkart/ })).toBeVisible()
  await expect(page.getByText(/has not checked how Flipkart hires yet/)).toBeVisible()
})

test('About has no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  for (const path of ['/about', '/about/settings']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), path).toBe(true)
  }
})

test('the company filter narrows resume projects, and a shared project goes through review', async ({ page }) => {
  await page.goto('/resume')
  const cards = page.getByRole('list', { name: 'Resume projects' }).locator(':scope > li')
  await expect(cards.first()).toBeVisible()
  const all = await cards.count()
  await page.getByRole('combobox', { name: 'Company' }).selectOption('tcs')
  await expect(page.getByRole('status')).toContainText('for TCS')
  expect(await cards.count()).toBeLessThan(all)

  const title = `Seat reservation ${Date.now()}`
  await page.getByRole('button', { name: 'Share the project that got you in' }).click()
  await page.getByRole('textbox', { name: 'Company' }).fill('Atlassian')
  await page.getByRole('textbox', { name: 'Role title' }).fill('Software Engineer, Backend')
  await page.getByRole('textbox', { name: 'Project name' }).fill(title)
  await page.getByRole('textbox', { name: 'What you built' }).fill('A booking API where one seat can never be sold twice, with expiring holds.')
  await page.getByRole('textbox', { name: 'How it helped you get in' }).fill('I walked through the unique constraint and the hold expiry in system design.')
  await page.getByRole('textbox', { name: 'Stack' }).fill('Spring Boot, PostgreSQL')
  await page.getByRole('textbox', { name: 'Email (never shown)' }).fill('ana@example.com')
  await page.getByRole('checkbox', { name: /I agree/ }).check()
  await page.getByRole('button', { name: 'Send for review' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Thank you' })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).first().click()

  // Not public until approved.
  await page.reload()
  await expect(page.getByText(title)).toHaveCount(0)

  await page.goto('/admin/review')
  await page.getByLabel('Admin token').fill('wrong')
  await page.getByRole('button', { name: 'Load pending' }).click()
  await expect(page.getByRole('alert')).toContainText('admin token')
  await page.getByLabel('Admin token').fill('e2e-admin-token')
  await page.getByRole('button', { name: 'Load pending' }).click()
  const row = page.getByRole('article', { name: title })
  await expect(row).toContainText('ana@example.com')
  await row.getByRole('button', { name: 'Approve' }).click()
  await expect(row).toHaveCount(0)

  await page.goto('/resume')
  const shared = page.getByRole('region', { name: 'From people who got in' })
  await expect(shared).toContainText(title)
  await expect(shared).not.toContainText('ana@example.com')
})
