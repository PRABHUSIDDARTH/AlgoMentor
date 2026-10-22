import { expect, test, type Page } from '@playwright/test'

/** Records every request the app makes to the AI endpoints. */
function watchAsk(page: Page): string[] {
  const asked: string[] = []
  page.on('request', (r) => {
    if (/\/ask(\/stream)?$/.test(new URL(r.url()).pathname)) asked.push(r.url())
  })
  return asked
}

async function linkRepo(page: Page, url = 'https://github.com/demo/library') {
  await page.getByRole('textbox', { name: 'GitHub repository link' }).fill(url)
  await page.getByRole('button', { name: 'Link repository' }).click()
}

test('a lesson quiz is passed, the module completed and the track shows 1 of 10', async ({ page }) => {
  await page.goto('/learn')
  await page.getByRole('link', { name: /Start Object-oriented programming/ }).click()
  await expect(page).toHaveURL(/\/learn\/oop\/classes-objects$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Classes & objects' })).toBeVisible()
  const check = page.getByRole('button', { name: 'Check answers' })
  await expect(check).toBeDisabled()

  // First try: pick the first option everywhere, then learn the right answers from the feedback.
  const groups = page.getByRole('radiogroup')
  await expect(groups).toHaveCount(5)
  for (let i = 0; i < 5; i++) await groups.nth(i).getByRole('radio').first().check()
  await expect(check).toBeEnabled()
  await check.click()
  const done = page.getByRole('status').filter({ hasText: 'of 5 correct' })
  await expect(done).toBeVisible()
  const correct = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[role=radiogroup]')).map((g) => {
      const li = g.closest('li')!
      const first = g.querySelector('label span')!.textContent!
      const wrong = /^Not quite: the answer is "(.*)"\. $/.exec(li.querySelector(':scope > p span')?.textContent ?? '')
      return wrong ? wrong[1] : first
    }),
  )

  // Second try with the right answers.
  await page.getByRole('button', { name: 'Try again' }).click()
  for (let i = 0; i < 5; i++) await groups.nth(i).getByRole('radio', { name: correct[i], exact: true }).check()
  await check.click()
  await expect(done).toHaveText('5 of 5 correct')
  await page.getByRole('button', { name: 'Mark complete' }).click()
  await expect(page.getByText(/^Completed\. It will come back/)).toBeVisible()
  await page.goto('/learn/oop')
  await expect(page.getByText('1 of 10 complete')).toBeVisible()
  await page.goto('/learn')
  await expect(page.getByText('1 of 10 modules')).toBeVisible()
})

test('a project repo is linked and its milestones show 3 passed and 1 failing', async ({ page }) => {
  await page.goto('/projects/library-manager')
  await expect(page.getByRole('heading', { level: 1, name: 'Library manager' })).toBeVisible()
  await linkRepo(page)
  await expect(page.getByText('demo/library')).toBeVisible()
  await page.getByRole('button', { name: 'Check all milestones' }).click()
  await expect(page.getByText('3 of 4 milestones passed')).toBeVisible()
  const rows = page.getByRole('list', { name: 'Git milestones' }).locator(':scope > li')
  await expect(rows).toHaveCount(4)
  for (const i of [0, 1, 2]) await expect(rows.nth(i)).toContainText(/Passed [A-Z][a-z]{2} \d+/)
  await expect(rows.nth(3)).toContainText('Not yet')
  await expect(rows.nth(3)).toContainText('Not done yet')
  // The passes are earned records: they survive a reload.
  await page.reload()
  await expect(page.getByText('3 of 4 milestones passed')).toBeVisible()
})

test('a private repo gets the make-it-public message', async ({ page }) => {
  await page.goto('/projects/library-manager')
  await linkRepo(page, 'git@github.com:somebody/else.git')
  await page.getByRole('button', { name: 'Check First commit and push' }).click()
  await expect(page.getByText('Make the repository public to verify it.')).toBeVisible()
})

test('a bad repo link is a format error and nothing is saved', async ({ page }) => {
  await page.goto('/projects/library-manager')
  await linkRepo(page, 'https://gitlab.com/ana/library')
  await expect(page.getByRole('alert')).toContainText('Use a repository link like https://github.com/you/your-repo.')
  await expect(page.getByRole('textbox', { name: 'GitHub repository link' })).toBeVisible()
})

test('Git pages check a challenge and never call the AI', async ({ page }) => {
  const asked = watchAsk(page)
  await page.goto('/git')
  await expect(page.getByRole('list', { name: 'Challenges' }).locator(':scope > li')).toHaveCount(10)
  await page.getByRole('link', { name: 'Feature branch and pull request' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Feature branch and pull request' })).toBeVisible()
  await expect(page.getByText(/No AI on Git pages/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Check this challenge' })).toBeDisabled()
  await linkRepo(page)
  await page.getByRole('button', { name: 'Check this challenge' }).click()
  await expect(page.getByText(/^Passed [A-Z][a-z]{2} \d+/)).toBeVisible()
  await page.getByRole('link', { name: /Next: Resolve a merge conflict/ }).click()
  await expect(page.getByRole('region', { name: 'Set up the challenge' })).toBeVisible()
  await page.getByRole('button', { name: 'Check this challenge' }).click()
  await expect(page.getByText('Not yet')).toBeVisible()
  await page.goto('/git')
  await expect(page.getByText('1 of 10 challenges passed')).toBeVisible()
  await page.goto('/projects/parking-lot')
  await page.goto('/learn/oop/classes-objects')
  await page.goto('/resume')
  expect(asked).toEqual([])
})

test('setup commands are copyable and never piped into a shell', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/git/squash')
  const box = page.getByRole('region', { name: 'Set up the challenge' })
  await box.getByRole('button', { name: 'Copy bash command' }).click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('/git-challenges/squash.sh')
  expect(copied).not.toMatch(/\|\s*(ba)?sh\b/)
  // The scripts the commands download are really served.
  for (const ext of ['sh', 'ps1']) {
    const res = await page.request.get(`/git-challenges/squash.${ext}`)
    expect(res.status()).toBe(200)
    expect(await res.text()).toContain('squash')
  }
})

test('resume projects filter by target and role, and check a repository', async ({ page }) => {
  await page.goto('/resume')
  const cards = page.getByRole('list', { name: 'Resume projects' }).locator(':scope > li')
  await expect(cards).toHaveCount(12)
  await page.getByRole('combobox', { name: 'Target' }).selectOption('startup')
  const startup = await cards.count()
  expect(startup).toBeLessThan(12)
  await page.getByRole('combobox', { name: 'Role' }).selectOption('intern')
  expect(await cards.count()).toBeLessThanOrEqual(startup)
  await page.getByRole('combobox', { name: 'Target' }).selectOption('all')
  await page.getByRole('combobox', { name: 'Role' }).selectOption('all')
  await expect(cards).toHaveCount(12)
  const first = cards.first()
  await expect(first).toContainText('Template')
  await first.getByRole('button', { name: /Make your GitHub shine/ }).click()
  await linkRepo(page)
  await first.getByRole('button', { name: 'Check repository' }).click()
  await expect(first.getByText('1 of 2 items done')).toBeVisible()
  await expect(first.getByText('Add a CI workflow under .github/workflows')).toBeVisible()
})

test('the level pages show both meters and Today shows the lower readiness', async ({ page }) => {
  await page.goto('/level')
  await expect(page.getByRole('meter', { name: /^Readiness for/ })).toBeVisible()
  await page.getByRole('link', { name: 'Core CS level', exact: true }).first().click()
  await expect(page).toHaveURL(/\/level\/core$/)
  await expect(page.getByRole('meter', { name: /^Core CS readiness for/ })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Core CS: what to do next' }).getByRole('listitem')).toHaveCount(3)
  await page.goto('/today')
  await expect(page.getByText(/^DSA \d+% · Core CS \d+%$/)).toBeVisible()
})

test('the main controls work from the keyboard alone', async ({ page }) => {
  // Quiz: arrow keys move between options and keep one selected.
  await page.goto('/learn/oop/classes-objects')
  const radios = page.getByRole('radiogroup').first().getByRole('radio')
  await radios.first().focus()
  await page.keyboard.press('ArrowDown')
  await expect(radios.nth(1)).toBeChecked()
  await page.keyboard.press('ArrowUp')
  await expect(radios.first()).toBeChecked()

  // Resume accordion: Enter opens it and focus stays on the trigger, with a visible focus ring.
  await page.goto('/resume')
  const trigger = page.getByRole('button', { name: /Make your GitHub shine/ }).first()
  await page.keyboard.press('Tab')
  await trigger.focus()
  await expect(trigger).toBeFocused()
  const ring = await trigger.evaluate((el) => {
    const c = getComputedStyle(el)
    return c.outlineStyle !== 'none' || c.boxShadow !== 'none' || c.borderBottomStyle !== 'none'
  })
  expect(ring).toBe(true)
  await page.keyboard.press('Enter')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('textbox', { name: 'GitHub repository link' }).first()).toBeVisible()

  // Git challenge: link a repo and run the check without touching the mouse.
  await page.goto('/git/feature-pr')
  const link = page.getByRole('textbox', { name: 'GitHub repository link' })
  await link.focus()
  await page.keyboard.type('https://github.com/demo/library')
  await page.keyboard.press('Enter')
  await expect(page.getByText('demo/library')).toBeVisible()
  await page.getByRole('button', { name: 'Check this challenge' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText(/^Passed [A-Z][a-z]{2} \d+/)).toBeVisible()
})

// jsdom can't measure layout, so overflow is checked in a real browser at phone width.
for (const path of ['/learn', '/learn/oop', '/learn/oop/classes-objects', '/learn/dbms/indexing', '/projects/parking-lot', '/git', '/git/squash', '/resume', '/level', '/today']) {
  test(`no horizontal scroll at 390px on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const { scroll, inner } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }))
    expect(scroll).toBeLessThanOrEqual(inner)
  })
}
