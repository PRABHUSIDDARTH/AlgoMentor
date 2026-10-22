import { expect, test } from '@playwright/test'

// path, section shown as current, tab shown as current (null: the page has no tab row)
const ROUTES: [string, string, string][] = [
  ['/app', 'Practice', 'Workspace'],
  ['/roadmap', 'Practice', 'Roadmap'],
  ['/roadmap/arrays', 'Practice', 'Roadmap'],
  ['/today', 'Practice', 'Today'],
  ['/tests', 'Practice', 'Tests'],
  ['/learn', 'Learn', 'Overview'],
  ['/learn/cn', 'Learn', 'Networks'],
  ['/learn/dbms/indexing', 'Learn', 'DBMS'],
  ['/projects', 'Learn', 'Projects'],
  ['/projects/library-manager', 'Learn', 'Projects'],
  ['/git', 'Git', 'Challenges'],
  ['/git/squash', 'Git', 'Challenges'],
  ['/git/health', 'Git', 'Repo health'],
  ['/level', 'Progress', 'DSA level'],
  ['/level/core', 'Progress', 'Core CS level'],
  ['/resume', 'Progress', 'Resume projects'],
]

for (const [path, section, tab] of ROUTES) {
  test(`${path} shows the navbar with ${section} / ${tab} current`, async ({ page }) => {
    await page.goto(path)
    const sections = page.getByRole('navigation', { name: 'Sections' })
    await expect(sections.getByRole('link', { name: section, exact: true })).toHaveAttribute('aria-current', 'page')
    const tabs = page.getByRole('navigation', { name: `${section} pages` })
    await expect(tabs.getByRole('link', { name: tab, exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Theme' })).toBeVisible()
  })
}

test('the landing page keeps its in-page links and Get started', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Page' }).getByRole('link', { name: 'How it works' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/app')
  await expect(page.getByRole('navigation', { name: 'Sections' })).toHaveCount(0)
})

test('a section link navigates without a full reload and its tabs reach every page', async ({ page }) => {
  await page.goto('/today')
  await page.evaluate(() => { (window as unknown as { __stay: boolean }).__stay = true })
  await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Learn', exact: true }).click()
  await expect(page).toHaveURL(/\/learn$/)
  expect(await page.evaluate(() => (window as unknown as { __stay?: boolean }).__stay)).toBe(true)
  await page.getByRole('navigation', { name: 'Learn pages' }).getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
})

test('Settings is the last control in keyboard order', async ({ page }) => {
  await page.goto('/learn')
  const names = await page.getByRole('banner').getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? e.textContent ?? ''))
  expect(names[names.length - 1]).toBe('Settings')
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('the menu reaches every page and nothing scrolls sideways', async ({ page }) => {
    await page.goto('/learn')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Menu' }).click()
    const menu = page.getByRole('dialog')
    for (const name of ['Workspace', 'Tests', 'Networks', 'Projects', 'Repo health', 'Core CS level', 'Resume projects']) {
      await expect(menu.getByRole('link', { name, exact: true })).toBeVisible()
    }
    await menu.getByRole('link', { name: 'Repo health', exact: true }).click()
    await expect(page).toHaveURL(/\/git\/health$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})
