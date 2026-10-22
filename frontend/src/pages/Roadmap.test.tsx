import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { STAGES } from '@/content/roadmap'
import { looksLikeProblemRef } from '@/lib/api'
import { loadProgress, recordSolve } from '@/practice/progress'
import { saveSettings, saveStats } from '@/practice/store'
import Roadmap from './Roadmap'
import RoadmapStage from './RoadmapStage'

function AppProbe() {
  const l = useLocation()
  return <p data-testid="at">{l.pathname + l.search}</p>
}

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/roadmap/:stageId" element={<RoadmapStage />} />
          <Route path="/app" element={<AppProbe />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

const first = STAGES[0]
const firstTotal = first.patterns.reduce((n, p) => n + p.problems.length, 0)

afterEach(() => localStorage.clear())

describe('Roadmap', () => {
  it('listsAll18StagesWithProgressText', () => {
    renderAt('/roadmap')
    const list = screen.getByRole('list', { name: 'Roadmap stages' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(18)
    expect(within(screen.getByRole('listitem', { name: /^1\. / })).getByText(`0 of ${firstTotal} solved`)).toBeInTheDocument()
  })

  it('lockedStageShowsUnlockAnyway', async () => {
    renderAt('/roadmap')
    const arrays = screen.getByRole('listitem', { name: /2\. Arrays/ })
    expect(within(arrays).getByText(/Locked/)).toBeInTheDocument()
    await userEvent.click(within(arrays).getByRole('button', { name: 'Unlock anyway: Arrays' }))
    expect(within(arrays).queryByText(/Locked/)).toBeNull()
  })

  it('currentStageHighlighted', () => {
    renderAt('/roadmap')
    expect(screen.getByRole('listitem', { name: /1\. Complexity/ })).toHaveAttribute('aria-current', 'step')
  })

  it('targetLabelForKeyStages', () => {
    saveSettings({ target: { company: 'faang', role: 'sde1' }, dailyGoal: 3 })
    renderAt('/roadmap')
    expect(within(screen.getByRole('listitem', { name: /14\. Graphs/ })).getByText('Key for FAANG / product')).toBeInTheDocument()
    expect(within(screen.getByRole('listitem', { name: /16\. Tries/ })).queryByText(/Key for/)).toBeNull()
  })

  it('priorKnowledgeOfferedAt15TagSolves', async () => {
    saveSettings({ leetcode: 'demo', target: { company: 'faang', role: 'sde1' }, dailyGoal: 3 })
    saveStats('leetcode', { username: 'demo', ranking: 1, solved: { easy: 1, medium: 1, hard: 1, total: 3 }, topics: [{ tag: 'Hash Table', solved: 15 }], recent: [] })
    renderAt('/roadmap')
    const hashing = screen.getByRole('listitem', { name: /3\. Hashing/ })
    await userEvent.click(within(hashing).getByRole('button', { name: 'Mark as known: Hashing' }))
    const total = STAGES[2].patterns.reduce((n, p) => n + p.problems.length, 0)
    expect(within(hashing).getByText(`${total} of ${total} solved`)).toBeInTheDocument()
  })

  it('stagePageListsPatternsAndProblems', () => {
    renderAt(`/roadmap/${first.id}`)
    expect(screen.getByRole('heading', { level: 1, name: first.title })).toBeInTheDocument()
    for (const p of first.patterns) expect(screen.getByRole('heading', { level: 2, name: p.title })).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(firstTotal)
  })

  it('solveLinkCarriesFrom', async () => {
    renderAt(`/roadmap/${first.id}`)
    const q = first.patterns[0].problems[0]
    await userEvent.click(screen.getByRole('link', { name: `Solve ${q.title}` }))
    // q must be something the workspace recognises as a LeetCode problem (a URL), not a bare slug.
    expect(screen.getByTestId('at')).toHaveTextContent(`/app?q=${encodeURIComponent(q.url)}&from=${q.id}`)
    expect(looksLikeProblemRef(q.url)).toBe(true)
  })

  it('tickingAProblemUpdatesProgress', async () => {
    renderAt(`/roadmap/${first.id}`)
    const q = first.patterns[0].problems[0]
    await userEvent.click(screen.getByRole('checkbox', { name: `Mark ${q.title} solved` }))
    expect(loadProgress()[q.id]?.status).toBe('solved')
    expect(screen.getByText(`1 of ${firstTotal} solved`)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: `Mark ${q.title} solved` }))
    expect(loadProgress()[q.id]).toBeUndefined()
  })

  it('showsReviewDue', () => {
    const q = first.patterns[0].problems[0]
    recordSolve(q.id, { hintsUsed: 0, now: Date.now() - 3 * 86_400_000 })
    renderAt(`/roadmap/${first.id}`)
    expect(within(screen.getByRole('listitem', { name: new RegExp(q.title) })).getByText('Review due')).toBeInTheDocument()
  })

  it('leetcodeLinkOpensExternally', () => {
    renderAt(`/roadmap/${first.id}`)
    const q = first.patterns[0].problems[0]
    const link = screen.getByRole('link', { name: `${q.title} on LeetCode` })
    expect(link).toHaveAttribute('href', q.url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('seeAlsoShowsCrossReferences', () => {
    renderAt(`/roadmap/arrays`)
    const twoPointers = screen.getByRole('region', { name: 'Two pointers from both ends' })
    expect(within(twoPointers).getByText(/Also in/)).toBeInTheDocument()
    expect(within(twoPointers).getByRole('link', { name: /Striver A2Z Step 3/ })).toHaveAttribute('href', 'https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet')
    expect(within(twoPointers).getByRole('link', { name: /RisingBrain Two-Pointer/ })).toBeInTheDocument()
  })

  it('unknownStageShowsNotFound', () => {
    renderAt('/roadmap/nope')
    expect(screen.getByRole('heading', { name: 'Stage not found' })).toBeInTheDocument()
  })
})
