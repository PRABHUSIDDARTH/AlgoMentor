import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Workspace from '@/pages/Workspace'
import type { MentorSession, ProblemContext } from '@/state/useMentorSession'
import { MentorPanel } from './MentorPanel'

const api = vi.hoisted(() => ({ askStream: vi.fn(), fetchProblem: vi.fn() }))
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), ...api }))
const { ApiError } = await import('@/lib/api')

const problem: ProblemContext = { key: 'two-sum', source: 'leetcode', title: '1. Two Sum', statement: 'Find two numbers.', tags: [] }

function session(overrides: Partial<MentorSession> = {}): MentorSession {
  const base = {
    problem, tab: 'hints', hints: [], streaming: null, explain: undefined, solution: {}, language: 'python',
    followups: [], solutionRevealed: false, solved: false, status: 'ready', error: undefined, cooldownUntil: undefined,
    history: [], hintsRemaining: 4,
    openProblem: vi.fn(), openEntry: vi.fn(), editStatement: vi.fn(), setTab: vi.fn(), explainProblem: vi.fn(),
    nextHint: vi.fn(), revealSolution: vi.fn(), setLanguage: vi.fn(), askFollowUp: vi.fn(), markSolved: vi.fn(),
    retry: vi.fn(), reset: vi.fn(), requestSolution: vi.fn(),
  }
  const merged = { ...base, ...overrides } as MentorSession
  return { ...merged, hintsRemaining: overrides.hintsRemaining ?? 4 - merged.hints.length }
}

function renderPanel(s: MentorSession) {
  return render(<TooltipProvider><MentorPanel session={s} /><Toaster /></TooltipProvider>)
}

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

describe('MentorPanel', () => {
  it('tabsShowHintCounter', () => {
    renderPanel(session({ hints: ['a', 'b'] }))
    const tab = screen.getByRole('tab', { name: /Hints/ })
    expect(tab).toHaveTextContent('Hints')
    expect(tab).toHaveTextContent('2 / 4')
  })

  it('stepperLabels', () => {
    renderPanel(session())
    const stepper = screen.getByRole('list', { name: 'Hint progress' })
    for (const label of ['Nudge', 'Direction', 'Approach', 'Technique', 'Solution']) {
      expect(within(stepper).getByText(label)).toBeInTheDocument()
    }
  })

  it('pastHintsDimmedCurrentWriting', () => {
    renderPanel(session({ hints: ['**Hint 1:** use a map'], streaming: { tab: 'hints', text: 'Pair it with' }, status: 'streaming' }))
    expect(screen.getByText('read')).toBeInTheDocument()
    expect(screen.getByText('writing…')).toBeInTheDocument()
    expect(screen.getByText('use a map')).toBeInTheDocument()
  })

  it('revealAsksConfirmWhenHintsRemain', async () => {
    const s = session({ hints: ['a', 'b'] })
    renderPanel(s)
    await userEvent.click(screen.getByRole('button', { name: 'Reveal solution' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('skip 2 hints')
    expect(s.revealSolution).not.toHaveBeenCalled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reveal solution' }))
    expect(s.revealSolution).toHaveBeenCalledOnce()
  })

  it('revealDialogReturnsFocusToItsButton', async () => {
    renderPanel(session({ hints: ['a'] }))
    const reveal = screen.getByRole('button', { name: 'Reveal solution' })
    await userEvent.click(reveal)
    await screen.findByRole('alertdialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    await waitFor(() => expect(reveal).toHaveFocus())
  })

  it('revealSkipsConfirmWhenNoHintsLeft', async () => {
    const s = session({ hints: ['a', 'b', 'c', 'd'] })
    renderPanel(s)
    await userEvent.click(screen.getByRole('button', { name: 'Reveal solution' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(s.revealSolution).toHaveBeenCalledOnce()
  })

  it('codeBlockCopyShowsToast', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    renderPanel(session({ tab: 'solution', solutionRevealed: true, solution: { python: 'Use a map.\n\n```python\nseen = {}\n```' } }))
    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(writeText).toHaveBeenCalledWith('seen = {}')
    expect(await screen.findByText('Code copied')).toBeInTheDocument()
  })

  it('wrapToggleSetsAriaPressed', async () => {
    renderPanel(session({ tab: 'solution', solutionRevealed: true, solution: { python: '```python\nx = 1\n```' } }))
    const wrap = screen.getByRole('button', { name: 'Wrap lines' })
    expect(wrap).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(wrap)
    expect(wrap).toHaveAttribute('aria-pressed', 'true')
  })

  it('languageSwitchAsksForThatLanguage', async () => {
    const s = session({ tab: 'solution', solutionRevealed: true, solution: { python: '```python\nx = 1\n```' } })
    renderPanel(s)
    await userEvent.click(screen.getByRole('button', { name: 'Java' }))
    expect(s.setLanguage).toHaveBeenCalledWith('java')
  })

  it('complexityPanelShownWithBlockAndHiddenWithout', () => {
    const { unmount } = renderPanel(session({ tab: 'solution', solutionRevealed: true, solution: { python: 'Text\n\n```complexity\ntime: O(n) | one pass\nspace: O(n) | map\n```' } }))
    expect(screen.getByRole('region', { name: 'Complexity' })).toHaveTextContent('O(n)')
    unmount()
    renderPanel(session({ tab: 'solution', solutionRevealed: true, solution: { python: 'Just text' } }))
    expect(screen.queryByRole('region', { name: 'Complexity' })).toBeNull()
  })

  it('followUpRejectsOver1000Chars', async () => {
    renderPanel(session())
    const box = screen.getByRole('textbox', { name: 'Ask a follow-up' })
    await userEvent.click(box)
    await userEvent.paste('x'.repeat(1001))
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
    expect(screen.getByText('1001 / 1000')).toBeInTheDocument()
  })

  it('followUpDisabledAfter10Turns', () => {
    const followups = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? 'mentor' : 'user', text: `t${i}` })) as MentorSession['followups']
    renderPanel(session({ followups }))
    expect(screen.getByRole('textbox', { name: 'Ask a follow-up' })).toBeDisabled()
    expect(screen.getByText(/10 follow-ups/)).toBeInTheDocument()
  })

  it('followUpSendsQuestion', async () => {
    const s = session()
    renderPanel(s)
    await userEvent.type(screen.getByRole('textbox', { name: 'Ask a follow-up' }), 'why not an array?')
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
    expect(s.askFollowUp).toHaveBeenCalledWith('why not an array?')
  })

  it('inlineErrorRetry', async () => {
    const s = session({ status: 'error', error: { tab: 'hints', message: 'AlgoMentor couldn’t get an answer right now.' } })
    renderPanel(s)
    expect(screen.getByRole('alert')).toHaveTextContent('couldn’t get an answer')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(s.retry).toHaveBeenCalledOnce()
  })

  it('cooldownDisablesActionsWithCountdown', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    vi.setSystemTime(1_000_000)
    renderPanel(session({ status: 'error', error: { tab: 'hints', message: 'Too many requests.' }, cooldownUntil: 1_030_000 }))
    expect(screen.getByText('Try again in 30s')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next hint' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled()
    act(() => vi.advanceTimersByTime(30_000))
    expect(screen.getByRole('button', { name: 'Next hint' })).toBeEnabled()
  })

  it('actionsBlockedWhileTheNextProblemLoads', () => {
    renderPanel(session({ status: 'loadingProblem' }))
    expect(screen.getByRole('button', { name: 'Next hint' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reveal solution' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
  })

  it('languageSwitchesDisabledWhileStreaming', () => {
    renderPanel(session({ tab: 'solution', solutionRevealed: true, status: 'streaming', streaming: { tab: 'solution', text: '```python\nx = 1\n```' } }))
    expect(screen.getByRole('button', { name: 'Java' })).toBeDisabled()
  })

  it('missingLanguageSolutionOffersToFetchIt', async () => {
    const s = session({ tab: 'solution', solutionRevealed: true, language: 'java', solution: { python: '```python\nx\n```' } })
    renderPanel(s)
    await userEvent.click(screen.getByRole('button', { name: 'Get the Java solution' }))
    expect(s.requestSolution).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Back to Python' }))
    expect(s.setLanguage).toHaveBeenCalledWith('python')
  })

  it('iSolvedItMarksSolved', async () => {
    const s = session({ hints: ['a'] })
    renderPanel(s)
    await userEvent.click(screen.getByRole('button', { name: 'I solved it' }))
    expect(s.markSolved).toHaveBeenCalledOnce()
  })

  it('tabPanelsShowAFocusRing', () => {
    renderPanel(session())
    // Radix makes tab panels focusable; WCAG 2.4.7 needs a visible indicator when they are.
    expect(screen.getByRole('tabpanel').className).toMatch(/focus-visible:outline-2/)
    // shadcn's outline-none sets the outline-style variable to none, so the style must be restated.
    expect(screen.getByRole('tabpanel').className).toMatch(/focus-visible:outline-solid/)
  })

  it('ariaLiveAnnouncesOnlyStartAndFinish', () => {
    const streaming = session({ hints: ['a'], streaming: { tab: 'hints', text: 'b' }, status: 'streaming' })
    const { rerender } = renderPanel(streaming)
    const live = screen.getByTestId('mentor-live')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(live).toHaveTextContent(/^$/)
    rerender(<TooltipProvider><MentorPanel session={session({ hints: ['a', 'b'] })} /></TooltipProvider>)
    expect(live).toHaveTextContent('Hint 2 ready')
  })
})

describe('MentorPanel inside the workspace', () => {
  beforeEach(() => {
    api.fetchProblem.mockReset()
    api.askStream.mockReset()
  })

  function renderWorkspace() {
    return render(
      <TooltipProvider>
        <MemoryRouter initialEntries={['/app']}>
          <Routes><Route path="/app" element={<Workspace />} /></Routes>
        </MemoryRouter>
        <Toaster />
      </TooltipProvider>,
    )
  }

  async function pasteProblem(text: string) {
    await userEvent.click(screen.getByRole('textbox', { name: 'Problem number or statement' }))
    await userEvent.paste(text)
    await userEvent.click(screen.getByRole('button', { name: 'Start' }))
  }

  it('longPastedProblemShowsServerError', async () => {
    api.askStream.mockRejectedValue(new ApiError(400, 'Problem is too long (max 12000 characters).'))
    renderWorkspace()
    const statement = 'Merge overlapping intervals. ' + 'x'.repeat(200)
    await pasteProblem(statement)
    await userEvent.click(screen.getByRole('button', { name: 'Next hint' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Problem is too long (max 12000 characters).')
    expect(screen.getByText(statement)).toBeInTheDocument()
  })

  it('networkFailureShowsToast', async () => {
    api.askStream.mockRejectedValue(new TypeError('Failed to fetch'))
    renderWorkspace()
    await pasteProblem('Merge overlapping intervals.')
    await userEvent.click(screen.getByRole('button', { name: 'Next hint' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach AlgoMentor')
    expect(await screen.findByText('Connection problem')).toBeInTheDocument()
  })
})
