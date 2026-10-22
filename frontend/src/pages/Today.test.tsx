import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { STAGES } from '@/content/roadmap'
import { loadProgress, recordSolve } from '@/practice/progress'
import Today from './Today'

function Probe() {
  const l = useLocation()
  return <p data-testid="at">{l.pathname}</p>
}

function renderToday() {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={['/today']}>
        <Routes>
          <Route path="/today" element={<Today />} />
          <Route path="/test/:id" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

const first = STAGES[0].patterns[0].problems
afterEach(() => localStorage.clear())

describe('Today page', () => {
  it('showsThreeNewProblemsByDefault', () => {
    renderToday()
    const list = screen.getByRole('list', { name: 'New problems' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('0 of 3 done')).toBeInTheDocument()
  })

  it('todayPageAutoTicksOnProgressEvent', () => {
    renderToday()
    act(() => recordSolve(first[0].id, { hintsUsed: 0 }))
    expect(screen.getByRole('checkbox', { name: `${first[0].title} done` })).toBeChecked()
    expect(screen.getByText('1 of 3 done')).toBeInTheDocument()
  })

  it('ticksItemsSolvedWhileAway', () => {
    const { unmount } = renderToday()
    unmount() // e.g. Solve → workspace → "I solved it" → back to Today
    recordSolve(first[0].id, { hintsUsed: 0 })
    renderToday()
    expect(screen.getByRole('checkbox', { name: `${first[0].title} done` })).toBeChecked()
    expect(screen.getByText('1 of 3 done')).toBeInTheDocument()
  })

  it('manualTickPersistsAndRecordsTheSolve', async () => {
    const { unmount } = renderToday()
    await userEvent.click(screen.getByRole('checkbox', { name: `${first[1].title} done` }))
    expect(loadProgress()[first[1].id]?.status).toBe('solved')
    unmount()
    renderToday()
    expect(screen.getByRole('checkbox', { name: `${first[1].title} done` })).toBeChecked()
  })

  it('streakShownAsText', () => {
    renderToday()
    expect(screen.getByText(/Streak: 0 days/)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Last 14 days' })).toBeInTheDocument()
  })

  it('generateTestButtonPresent', () => {
    renderToday()
    expect(screen.getByRole('button', { name: 'Generate test' })).toBeInTheDocument()
  })
})
