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
  ['/learn/os', 'Learn', 'OS'],
  ['/learn/os/virtual-memory', 'Learn', 'OS'],
  ['/projects', 'Learn', 'Projects'],
  ['/projects/library-manager', 'Learn', 'Projects'],
  ['/git', 'Git', 'Challenges'],
  ['/git/squash', 'Git', 'Challenges'],
  ['/git/health', 'Git', 'Repo health'],
  ['/level', 'Progress', 'DSA level'],
  ['/level/core', 'Progress', 'Core CS level'],
  ['/resume', 'Progress', 'Resume projects'],
  ['/companies', 'Progress', 'Companies'],
  ['/companies/meta', 'Progress', 'Companies'],
  ['/about', 'About', 'Profile'],
  ['/about/settings', 'About', 'Settings'],
]

for (const [path, section, tab] of ROUTES) {
  test(`${path} shows the navbar with ${section} / ${tab} current`, async ({ page }) => {
    await page.goto(path)
    const sections = page.getByRole('navigation', { name: 'Sections' })
    await expect(sections.getByRole('link', { name: section, exact: true })).toHaveAttribute('aria-current', 'page')
    const tabs = page.getByRole('navigation', { name: `${section} pages` })
    await expect(tabs.getByRole('link', { name: tab, exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('button', { name: 'Theme' })).toBeVisible()
    // Both rows are the React Bits GooeyNav, which draws its blob on a canvas.
    await expect(sections.locator('canvas')).toHaveCount(1)
    await expect(tabs.locator('canvas')).toHaveCount(1)
  })
}

for (const [path, section] of [['/learn/nope', 'Learn'], ['/git/nope', 'Git'], ['/projects/nope', 'Learn'], ['/test/nope', 'Practice'], ['/roadmap/nope', 'Practice']] as const) {
  test(`${path} (not found) keeps the gooey navbar with ${section} current`, async ({ page }) => {
    await page.goto(path)
    const sections = page.getByRole('navigation', { name: 'Sections' })
    await expect(sections.locator('canvas')).toHaveCount(1)
    await expect(sections.getByRole('link', { name: section, exact: true })).toHaveAttribute('aria-current', 'page')
  })
}

test('the landing page keeps its in-page links and Get started', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Page' }).getByRole('link', { name: 'How it works' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Page' }).locator('canvas')).toHaveCount(1)
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

test('the theme toggle is the last control in the navbar and there is no floating settings button', async ({ page }) => {
  await page.goto('/learn')
  const names = await page.getByRole('banner').getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? e.textContent ?? ''))
  expect(names[names.length - 1]).toBe('Theme')
  await expect(page.getByRole('button', { name: 'Settings' })).toHaveCount(0)
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('the gooey navbar is visible and reaches every section and page', async ({ page }) => {
    await page.goto('/learn')
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveCount(0)
    const sections = page.getByRole('navigation', { name: 'Sections' })
    for (const name of ['Practice', 'Learn', 'Git', 'Progress']) await expect(sections.getByRole('link', { name, exact: true })).toBeVisible()
    await sections.getByRole('link', { name: 'Git', exact: true }).click()
    await expect(page).toHaveURL(/\/git$/)
    const tabs = page.getByRole('navigation', { name: 'Git pages' })
    await tabs.getByRole('link', { name: 'Repo health', exact: true }).click()
    await expect(page).toHaveURL(/\/git\/health$/)
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Progress', exact: true }).click()
    await page.getByRole('navigation', { name: 'Progress pages' }).getByRole('link', { name: 'Resume projects', exact: true }).scrollIntoViewIfNeeded()
    await page.getByRole('navigation', { name: 'Progress pages' }).getByRole('link', { name: 'Resume projects', exact: true }).click()
    await expect(page).toHaveURL(/\/resume$/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  for (const path of ['/', '/learn', '/learn/os/processes', '/today']) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  }
})

// The GooeyNav animates its blob and particles from the old item to the new one, which only works if the navbar
// is not rebuilt on every page change.
test('the navbar is the same element after navigating from the workspace to other sections', async ({ page }) => {
  await page.goto('/app')
  const sections = page.getByRole('navigation', { name: 'Sections' })
  await expect(sections.locator('canvas')).toHaveCount(1)
  await sections.evaluate((el) => { (el as HTMLElement & { __kept?: boolean }).__kept = true })
  for (const [name, url] of [['Learn', /\/learn$/], ['Git', /\/git$/], ['Progress', /\/level$/], ['Practice', /\/app$/]] as const) {
    await sections.getByRole('link', { name, exact: true }).click()
    await expect(page).toHaveURL(url)
    await expect(sections.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page')
    expect(await sections.evaluate((el) => (el as HTMLElement & { __kept?: boolean }).__kept)).toBe(true)
  }
})

test('the tabs row does not clip the blob particles on desktop', async ({ page }) => {
  await page.goto('/learn')
  const tabs = page.getByRole('navigation', { name: 'Learn pages' })
  await expect(tabs.locator('canvas')).toHaveCount(1)
  const clipped = await tabs.evaluate((el) => {
    for (let e = el.parentElement; e && e.tagName !== 'BODY'; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') return `${e.tagName}.${e.className}`
      // The page frame itself only clips at the edge of the window.
      if (e.tagName === 'HEADER') break
    }
    return null
  })
  expect(clipped).toBeNull()
})
