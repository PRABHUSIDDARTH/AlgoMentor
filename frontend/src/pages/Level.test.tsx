import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PROBLEMS } from '@/content/roadmap'
import { TRACKS } from '@/content/learn'
import { LEARN_KEY } from '@/learn/progress'
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
    const meter = screen.getByRole('meter', { name: /Readiness for FAANG \/ product SDE-1/ })
    expect(meter).toHaveAttribute('aria-valuenow', '0')
    expect(within(screen.getByRole('list', { name: 'What to do next' })).getAllByRole('listitem')).toHaveLength(3)
    const breakdown = screen.getByRole('table', { name: 'Score breakdown' })
    for (const row of ['Coverage', 'Difficulty', 'Retention', 'Tests', 'Consistency', 'External']) {
      expect(within(breakdown).getByRole('rowheader', { name: row })).toBeInTheDocument()
    }
  })

  it('levelShowsBothMeters', () => {
    renderLevel()
    expect(screen.getByRole('meter', { name: /Readiness for FAANG \/ product SDE-1/ })).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByRole('meter', { name: 'Core CS readiness for FAANG / product' })).toHaveAttribute('aria-valuenow', '0')
    const core = screen.getByRole('list', { name: 'Core CS: what to do next' })
    expect(within(core).getAllByRole('listitem')).toHaveLength(3)
    expect(within(core).getByText('OOP: finish 3 more modules')).toBeInTheDocument()
    const breakdown = screen.getByRole('table', { name: 'Core CS breakdown' })
    for (const row of ['Modules', 'Quizzes', 'Projects', 'Git challenges']) {
      expect(within(breakdown).getByRole('rowheader', { name: row })).toBeInTheDocument()
    }
  })

  it('coreMeterFollowsLearningProgress', () => {
    const oop = Object.fromEntries(TRACKS[0].modules.map((m) => [m.id, { bestQuiz: 5, completedAt: 1, reviewStep: 0, nextReviewAt: null }]))
    localStorage.setItem(LEARN_KEY, JSON.stringify(oop))
    renderLevel()
    // 10 of 30 modules (13.3) + quiz 50/150 (10) = 23.3 of a 70 bar
    expect(screen.getByRole('meter', { name: 'Core CS readiness for FAANG / product' })).toHaveAttribute('aria-valuenow', '33')
    expect(within(screen.getByRole('table', { name: 'Core CS breakdown' })).getByText('13.3 / 40')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Core CS: what to do next' })).getByText('Networks: finish 3 more modules')).toBeInTheDocument()
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
