import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { STAGES } from '@/content/roadmap'
import { generateTest, saveTest, type PracticeTest } from '@/practice/tests'
import TestRunner from './TestRunner'

const api = vi.hoisted(() => ({ askStream: vi.fn(), fetchProblem: vi.fn() }))
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), ...api }))

const ALL = STAGES.map((s) => s.id)
let test: PracticeTest

beforeEach(() => {
  api.fetchProblem.mockImplementation(async (ref: string) => ({ number: '1', title: ref, slug: ref, difficulty: 'Easy', tags: [], url: '', statement: 'Statement.' }))
  api.askStream.mockReturnValue(new Promise(() => {}))
  const t = generateTest(5, {}, ALL, 3)
  if ('error' in t) throw new Error(t.error)
  test = { ...t, createdAt: Date.now() }
  saveTest(test)
})

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

function renderRunner(id = test.id) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[`/test/${id}`]}>
        <Routes><Route path="/test/:testId" element={<TestRunner />} /></Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

describe('TestRunner', () => {
  it('runnerShowsTenProblemsAndTimer', async () => {
    renderRunner()
    expect(within(screen.getByRole('list', { name: 'Test problems' })).getAllByRole('listitem')).toHaveLength(10)
    expect(screen.getByRole('timer')).toHaveTextContent(/^(60:00|59:5\d)$/)
  })

  it('timerAnnouncesOncePerMinute', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(test.createdAt)
    renderRunner()
    const live = screen.getByTestId('timer-live')
    expect(live).toHaveTextContent('60 minutes left')
    act(() => vi.advanceTimersByTime(30_000))
    expect(live).toHaveTextContent('60 minutes left')
    act(() => vi.advanceTimersByTime(31_000))
    expect(live).toHaveTextContent('59 minutes left')
  })

  it('opensEachProblemFromLeetCodeNotAsPastedText', async () => {
    renderRunner()
    await vi.waitFor(() => expect(api.fetchProblem).toHaveBeenCalled())
    expect(api.fetchProblem.mock.calls[0][0]).toMatch(/^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/)
    expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent(/^Custom:/)
  })

  it('markSolvedAndSkipRecordResults', async () => {
    renderRunner()
    await userEvent.click(screen.getByRole('button', { name: 'Mark solved' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    const items = within(screen.getByRole('list', { name: 'Test problems' })).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Solved')
    expect(items[1]).toHaveTextContent('Skipped')
  })

  it('finishShowsReport', async () => {
    renderRunner()
    await userEvent.click(screen.getByRole('button', { name: 'Mark solved' }))
    await userEvent.click(screen.getByRole('button', { name: 'Finish test' }))
    expect(await screen.findByRole('heading', { name: 'Test report' })).toBeInTheDocument()
    expect(screen.getByText('1 / 10')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Weak stages' })).toBeInTheDocument()
  })

  it('unknownTestShowsMessage', () => {
    renderRunner('nope')
    expect(screen.getByRole('heading', { name: 'Test not found' })).toBeInTheDocument()
  })
})
