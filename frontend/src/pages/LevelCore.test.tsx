import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TRACKS } from '@/content/learn'
import { LEARN_KEY } from '@/learn/progress'
import LevelCore from './LevelCore'

function renderCore() {
  return render(<TooltipProvider><MemoryRouter><LevelCore /></MemoryRouter></TooltipProvider>)
}

afterEach(() => localStorage.clear())

describe('Core CS level page', () => {
  it('coreLevelShowsMeterGapsAndBreakdown', () => {
    renderCore()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Core CS')
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
    renderCore()
    // 10 of 40 modules (10) + quiz 50/200 (7.5) = 17.5 of a 70 bar
    expect(screen.getByRole('meter', { name: 'Core CS readiness for FAANG / product' })).toHaveAttribute('aria-valuenow', '25')
    expect(within(screen.getByRole('table', { name: 'Core CS breakdown' })).getByText('10.0 / 40')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Core CS: what to do next' })).getByText('Networks: finish 3 more modules')).toBeInTheDocument()
  })
})
