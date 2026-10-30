import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TRACKS } from '@/content/learn'
import { PROBLEMS, STAGES } from '@/content/roadmap'
import BelowFold from './BelowFold'

function renderBelowFold() {
  return render(<TooltipProvider><MemoryRouter><BelowFold /></MemoryRouter></TooltipProvider>)
}

describe('landing sections', () => {
  it('hintLadderDemoLocksTheSolutionUntilTheFourthHint', async () => {
    renderBelowFold()
    const demo = screen.getByRole('group', { name: 'Hint ladder demo' })
    expect(within(demo).queryByRole('button', { name: 'Show the solution' })).toBeNull()
    for (let i = 0; i < 3; i++) await userEvent.click(within(demo).getByRole('button', { name: i === 0 ? 'Ask for a hint' : 'Next hint' }))
    expect(within(demo).getByText('Hint 3')).toBeInTheDocument()
    expect(within(demo).queryByRole('button', { name: 'Show the solution' })).toBeNull()
    await userEvent.click(within(demo).getByRole('button', { name: 'Next hint' }))
    await userEvent.click(within(demo).getByRole('button', { name: 'Show the solution' }))
    expect(within(demo).getByText(/Time O\(n\), space O\(n\)/)).toBeInTheDocument()
    await userEvent.click(within(demo).getByRole('button', { name: 'Start over' }))
    expect(within(demo).getByText(/No hints yet/)).toBeInTheDocument()
  })

  it('roadmapListsAllRealStagesAndTheProblemTotal', () => {
    renderBelowFold()
    expect(within(screen.getByRole('list', { name: 'Roadmap stages' })).getAllByRole('listitem')).toHaveLength(STAGES.length)
    expect(screen.getByLabelText(`${PROBLEMS.size} problems`)).toBeInTheDocument()
  })

  it('learnShowsEveryTrackWithItsDiagram', () => {
    renderBelowFold()
    const list = screen.getByRole('list', { name: 'Learn tracks' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(TRACKS.length)
    for (const t of TRACKS) expect(within(list).getByRole('link', { name: t.title })).toHaveAttribute('href', `/learn/${t.id}`)
    expect(within(list).getAllByRole('img').length).toBe(TRACKS.length)
  })

  it('gitSectionShowsTheSetupCommandAndASampleResult', () => {
    renderBelowFold()
    expect(screen.getByRole('group', { name: 'bash' })).toHaveTextContent('conflict.sh')
    expect(screen.getByText('Passed Oct 22')).toBeInTheDocument()
    expect(screen.getByText(/no AI on these pages/i)).toBeInTheDocument()
  })

  it('connectionsAreHonestAboutWhatExists', () => {
    renderBelowFold()
    expect(screen.queryByText(/coming soon/i)).toBeNull()
    expect(screen.queryByText(/sign in with github/i)).toBeNull()
    for (const n of ['LeetCode', 'HackerRank', 'GeeksforGeeks']) expect(screen.getByRole('heading', { name: n })).toBeInTheDocument()
  })
})
