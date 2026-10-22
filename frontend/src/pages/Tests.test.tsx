import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PROBLEMS } from '@/content/roadmap'
import { TESTS_KEY } from '@/practice/tests'
import Tests from './Tests'

function At() {
  const l = useLocation()
  return <p data-testid="at">{l.pathname + l.search}</p>
}
function renderTests() {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={['/tests']}>
        <Routes><Route path="/tests" element={<Tests />} /><Route path="*" element={<At />} /></Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}
afterEach(() => localStorage.clear())

const ids = [...PROBLEMS.keys()]
const saved = (id: string, createdAt: number, results: ('solved' | 'skipped')[], finished: boolean) => ({
  id, seed: 1, createdAt, durationMin: 60,
  problems: results.map((r, i) => ({ problemId: ids[i], kind: 'new', result: r })),
  ...(finished ? { finishedAt: createdAt + 1000 } : {}),
})

describe('Tests page', () => {
  it('explainsTestsWhenThereAreNone', () => {
    renderTests()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Practice tests')
    expect(screen.getByText(/No tests yet/)).toBeInTheDocument()
  })

  it('listsSavedTestsNewestFirstWithScores', () => {
    localStorage.setItem(TESTS_KEY, JSON.stringify({
      old: saved('old', Date.UTC(2026, 0, 5), ['solved', 'skipped'], true),
      fresh: saved('fresh', Date.UTC(2026, 0, 9), ['solved', 'solved'], false),
    }))
    renderTests()
    const items = within(screen.getByRole('list', { name: 'Tests' })).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByRole('link', { name: /Resume/ })).toHaveAttribute('href', '/test/fresh')
    expect(within(items[0]).getByText('In progress')).toBeInTheDocument()
    expect(within(items[1]).getByRole('link', { name: /Report/ })).toHaveAttribute('href', '/test/old')
    expect(within(items[1]).getByText('1 of 2')).toBeInTheDocument()
  })

  it('generatesANewTest', async () => {
    renderTests()
    await userEvent.click(screen.getByRole('button', { name: 'Generate test' }))
    expect(screen.getByTestId('at')).toHaveTextContent('/test/new?level=1')
  })
})
