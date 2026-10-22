import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PROBLEMS } from '@/content/roadmap'
import { PROGRESS_KEY } from '@/practice/progress'
import Level from './Level'

function renderLevel() {
  return render(<TooltipProvider><MemoryRouter><Level /><Toaster /></MemoryRouter></TooltipProvider>)
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('Level page', () => {
  it('levelPageShowsLevelMeterGapsAndBreakdown', () => {
    renderLevel()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Level 1')
    const meter = screen.getByRole('meter', { name: /Readiness for MAANG SDE-1/ })
    expect(meter).toHaveAttribute('aria-valuenow', '0')
    expect(within(screen.getByRole('list', { name: 'What to do next' })).getAllByRole('listitem')).toHaveLength(3)
    const breakdown = screen.getByRole('table', { name: 'Score breakdown' })
    for (const row of ['Coverage', 'Difficulty', 'Retention', 'Tests', 'Consistency', 'External']) {
      expect(within(breakdown).getByRole('rowheader', { name: row })).toBeInTheDocument()
    }
  })

  it('dsaLevelPointsToCoreLevelInsteadOfShowingIt', () => {
    renderLevel()
    expect(screen.queryByRole('meter', { name: /Core CS readiness/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Core CS level/ })).toHaveAttribute('href', '/level/core')
  })

  it('levelUpMessageShownOnce', async () => {
    localStorage.setItem('algomentor.level.v1', '1')
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(Object.fromEntries([...PROBLEMS.keys()].map((id) => [id, { status: 'solved', reviewStep: 1, nextReviewAt: null }]))))
    const success = vi.spyOn(toast, 'success')
    const { unmount } = renderLevel()
    expect(await screen.findByText(/Level up: you're now level \d+/)).toBeInTheDocument()
    expect(Number(localStorage.getItem('algomentor.level.v1'))).toBeGreaterThan(1)
    unmount()
    renderLevel()
    // Sonner keeps toasts in a global store, so count calls rather than looking for text.
    expect(success).toHaveBeenCalledTimes(1)
  })
})
