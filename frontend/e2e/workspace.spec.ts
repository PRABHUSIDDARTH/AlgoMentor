import { expect, test, type Page } from '@playwright/test'

async function openTwoSum(page: Page) {
  await page.goto('/app?q=1')
  await expect(page.getByRole('heading', { level: 1, name: '1. Two Sum' })).toBeVisible()
}

async function waitForAnswer(page: Page) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

test('hints arrive one at a time and the stepper follows', async ({ page }) => {
  await openTwoSum(page)
  await page.getByRole('button', { name: 'Next hint' }).click()
  await expect(page.locator('#hint-0')).toContainText('Think about which values')
  await waitForAnswer(page)
  await page.getByRole('button', { name: 'Next hint' }).click()
  await expect(page.locator('#hint-1')).toBeVisible()
  await waitForAnswer(page)
  await expect(page.getByRole('tab', { name: /Hints/ })).toContainText('2 / 4')
  await expect(page.getByRole('list', { name: 'Hint progress' }).getByRole('button', { name: 'Go to hint 2' })).toBeVisible()
})

test('revealing early asks to confirm, then shows code and complexity', async ({ page }) => {
  await openTwoSum(page)
  await page.getByRole('button', { name: 'Reveal solution' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('skip 4 hints')
  await dialog.getByRole('button', { name: 'Reveal solution' }).click()
  await expect(page.locator('figure figcaption')).toContainText('python')
  await expect(page.getByRole('region', { name: 'Complexity' })).toContainText('O(n)')
})

test('switching to Java asks for Java code', async ({ page }) => {
  await openTwoSum(page)
  await page.getByRole('tab', { name: 'Solution' }).click()
  await page.getByRole('tabpanel').getByRole('button', { name: 'Reveal solution' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reveal solution' }).click()
  await waitForAnswer(page)
  await page.getByRole('button', { name: 'Java' }).click()
  await expect(page.locator('figure figcaption').first()).toContainText('java')
})

test('a follow-up question gets an answer', async ({ page }) => {
  await openTwoSum(page)
  await page.getByRole('textbox', { name: 'Ask a follow-up' }).fill('why not an array?')
  await page.getByRole('button', { name: 'Ask' }).click()
  await expect(page.getByText(/Follow-up:/)).toBeVisible()
})

test('recent problems survive a reload', async ({ page }) => {
  await openTwoSum(page)
  await page.goto('/app')
  await expect(page.getByRole('complementary', { name: 'Recent problems' }).getByRole('button', { name: /1\. Two Sum/ })).toBeVisible()
})

test('Ctrl K jumps to a LeetCode number', async ({ page }) => {
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'What are we solving today?' })).toBeVisible()
  await page.keyboard.press('Control+k')
  await page.getByRole('dialog').getByRole('combobox').fill('146')
  await page.getByRole('option', { name: 'Open LeetCode #146' }).click()
  await expect(page.getByRole('heading', { level: 1, name: '146. LRU Cache' })).toBeVisible()
})

test('on desktop the workspace fills the window and the panes scroll instead of the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await openTwoSum(page)
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Next hint' }).click()
    await waitForAnswer(page)
  }
  const metrics = await page.evaluate(() => {
    const mentor = document.querySelector('[data-testid="mentor-scroll"]') as HTMLElement
    return { pageScrolls: document.documentElement.scrollHeight > window.innerHeight + 1, shellHeight: document.querySelector('[data-testid="workspace-shell"]')!.getBoundingClientRect().height, mentorBottom: mentor.getBoundingClientRect().bottom }
  })
  expect(metrics.pageScrolls).toBe(false)
  expect(Math.round(metrics.shellHeight)).toBe(720)
  expect(Math.round(metrics.mentorBottom)).toBe(720)
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 360, height: 780 } })

  test('the panes stack with the problem first', async ({ page }) => {
    await openTwoSum(page)
    const problem = await page.locator('#problem-title').boundingBox()
    const mentor = await page.getByRole('region', { name: 'Mentor' }).boundingBox()
    expect(problem && mentor && mentor.y > problem.y).toBe(true)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)
  })
})
