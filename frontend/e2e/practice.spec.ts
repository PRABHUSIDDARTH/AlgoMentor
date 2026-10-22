import { expect, test, type Page } from '@playwright/test'

const OPEN_FOUR = () => {
  if (!sessionStorage.getItem('seeded')) {
    localStorage.setItem('algomentor.unlocks.v1', JSON.stringify(['arrays', 'hashing', 'strings']))
    sessionStorage.setItem('seeded', '1')
  }
}

async function waitForAnswer(page: Page) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

test('Settings connects a LeetCode profile and shows its stats', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Settings' }).click()
  const dialog = page.getByRole('dialog', { name: 'Settings' })
  await dialog.getByRole('textbox', { name: 'LeetCode profile URL' }).fill('https://leetcode.com/u/demo/')
  await dialog.getByRole('button', { name: 'Connect LeetCode' }).click()
  await expect(dialog.getByText('312 solved · 140 Easy · 150 Medium · 22 Hard')).toBeVisible()
  await dialog.getByRole('textbox', { name: 'GeeksforGeeks profile URL' }).fill('geeksforgeeks.org/user/ghost')
  await dialog.getByRole('button', { name: 'Connect GeeksforGeeks' }).click()
  await expect(dialog.getByRole('alert')).toContainText('No public profile found for ghost')
})

test('solving a roadmap problem in the workspace updates the roadmap', async ({ page }) => {
  await page.goto('/roadmap')
  await page.getByRole('link', { name: '1. Complexity & maths basics' }).click()
  const first = page.getByRole('link', { name: /^Solve / }).first()
  await first.click()
  await expect(page).toHaveURL(/\/app\?q=https%3A%2F%2Fleetcode\.com%2Fproblems%2F[a-z0-9-]+%2F&from=/)
  await expect(page.locator('#problem-title')).not.toContainText('Custom:')
  await page.getByRole('button', { name: 'I solved it' }).click()
  await page.goto('/roadmap')
  await expect(page.getByRole('listitem', { name: /^1\. / })).toContainText(/1 of \d+ solved/)
})

test('Today lists the daily goal and ticks a solved problem', async ({ page }) => {
  await page.goto('/today')
  const list = page.getByRole('list', { name: 'New problems' })
  await expect(list.getByRole('listitem')).toHaveCount(3)
  await list.getByRole('checkbox').first().check()
  await expect(page.getByText('1 of 3 done')).toBeVisible()
  await page.reload()
  await expect(page.getByText('1 of 3 done')).toBeVisible()
})

test('a generated test runs to a report', async ({ page }) => {
  await page.addInitScript(OPEN_FOUR)
  await page.goto('/today')
  await page.getByRole('button', { name: 'Generate test' }).click()
  await expect(page).toHaveURL(/\/test\/t[0-9a-z]+$/)
  await expect(page.getByRole('list', { name: 'Test problems' }).getByRole('listitem')).toHaveCount(10)
  await expect(page.getByRole('timer')).toBeVisible()
  await expect(page.locator('#problem-title')).toBeVisible()
  await page.getByRole('button', { name: 'Mark solved' }).click()
  await expect(page.locator('#problem-title')).toBeVisible()
  await page.getByRole('button', { name: 'Next hint' }).click()
  await waitForAnswer(page)
  await page.getByRole('button', { name: 'Mark solved' }).click()
  await page.getByRole('button', { name: 'Finish test' }).click()
  await expect(page.getByRole('heading', { name: 'Test report' })).toBeVisible()
  await expect(page.getByText('1.5 / 10')).toBeVisible()
})

test('a new learner is told what a test needs', async ({ page }) => {
  await page.goto('/test/new')
  await expect(page.getByRole('alert')).toContainText('at least 10 problems across at least 4 stages')
})

test('the level page shows a level, readiness and three next steps', async ({ page }) => {
  await page.goto('/level')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Level \d+$/)
  await expect(page.getByRole('meter', { name: /Readiness for/ })).toBeVisible()
  await expect(page.getByRole('list', { name: 'What to do next', exact: true }).getByRole('listitem')).toHaveCount(3)
})

for (const path of ['/', '/app', '/roadmap', '/today', '/level', '/learn', '/git', '/resume']) {
  test(`the Settings gear is reachable and clear of the nav on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(path)
    const gear = page.getByRole('button', { name: 'Settings' })
    await expect(gear).toBeVisible()
    const theme = page.getByRole('button', { name: 'Theme' }).first()
    const [g, t] = [await gear.boundingBox(), await theme.boundingBox()]
    const overlap = !!g && !!t && g.x < t.x + t.width && t.x < g.x + g.width && g.y < t.y + t.height && t.y < g.y + g.height
    expect(overlap).toBe(false)
    await gear.click()
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
  })
}

test('choosing a company as the target shows up on Today', async ({ page }) => {
  await page.goto('/companies/meta')
  await page.getByRole('button', { name: 'Set Meta as my target' }).click()
  await expect(page.getByText('Meta is your target.')).toBeVisible()
  await page.goto('/today')
  await expect(page.getByRole('meter', { name: /Readiness for Meta/ })).toBeVisible()
})
