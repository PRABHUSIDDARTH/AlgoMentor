import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const ROUTES = [
  '/', '/app', '/app?q=1', '/roadmap', '/roadmap/arrays', '/today', '/level',
  '/learn', '/learn/oop', '/learn/oop/classes-objects', '/learn/cn/tcp-udp', '/learn/dbms/indexing',
  '/projects/library-manager', '/git', '/git/merge-conflict', '/resume',
  '/tests', '/projects', '/git/health', '/level/core',
]

for (const colorScheme of ['light', 'dark'] as const) {
  for (const path of ROUTES) {
    test(`no serious or critical axe violations on ${path} (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      if (path.includes('q=1')) await expect(page.locator('#problem-title')).toBeVisible()
      const results = await new AxeBuilder({ page }).analyze()
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([])
    })
  }
}
