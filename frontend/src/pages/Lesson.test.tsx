import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TRACKS } from '@/content/learn'
import { loadLearn } from '@/learn/progress'
import Learn from './Learn'
import LearnTrack from './LearnTrack'
import Lesson from './Lesson'

const oop = TRACKS[0]
const first = oop.modules[0]

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:trackId" element={<LearnTrack />} />
          <Route path="/learn/:trackId/:moduleId" element={<Lesson />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

/** Answers every question with the keyboard: focus an option and press Space. */
async function answerAll(correct: boolean) {
  const groups = screen.getAllByRole('radiogroup')
  for (const [i, g] of groups.entries()) {
    const q = first.quiz[i]
    const pick = correct ? q.answer : (q.answer + 1) % q.options.length
    within(g).getAllByRole('radio')[pick].focus()
    await userEvent.keyboard(' ')
  }
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('Lesson page', () => {
  it('lessonRendersMarkdownDiagramCodeTabsAndInterview', async () => {
    renderAt(`/learn/oop/${first.id}`)
    expect(screen.getByRole('heading', { level: 1, name: first.title })).toBeInTheDocument()
    expect(screen.getByText(`${first.minutes} min read`)).toBeInTheDocument()
    expect(document.querySelector('.prose-am h2, .prose-am p')).not.toBeNull()
    expect(screen.getByRole('img', { name: /./ })).toHaveAttribute('aria-label')
    for (const name of ['Java', 'Python', 'C++']) expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Python' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent(first.code!.python.split('\n')[0].trim())
    const interview = screen.getByRole('region', { name: 'Interview questions' })
    await userEvent.click(within(interview).getByRole('button', { name: first.interview[0].q }))
    expect(within(interview).getByText(first.interview[0].a)).toBeVisible()
  })

  it('quizKeyboardAndFeedback', async () => {
    renderAt(`/learn/oop/${first.id}`)
    const quiz = screen.getByRole('region', { name: 'Check yourself' })
    expect(within(quiz).getAllByRole('radiogroup')).toHaveLength(5)
    expect(within(quiz).getAllByRole('radiogroup')[0]).toHaveAccessibleName(first.quiz[0].prompt)
    const check = within(quiz).getByRole('button', { name: 'Check answers' })
    expect(check).toBeDisabled()
    await answerAll(false)
    expect(check).toBeEnabled()
    await userEvent.click(check)
    expect(within(quiz).getByRole('status')).toHaveTextContent('0 of 5 correct')
    expect(within(quiz).getAllByText(first.quiz[0].why).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Mark complete' })).toBeDisabled()
  })

  it('passingTheQuizAllowsMarkComplete', async () => {
    renderAt(`/learn/oop/${first.id}`)
    await answerAll(true)
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }))
    expect(screen.getByRole('status')).toHaveTextContent('5 of 5 correct')
    await userEvent.click(screen.getByRole('button', { name: 'Mark complete' }))
    expect(loadLearn()[first.id].completedAt).toBeTypeOf('number')
    expect(screen.getByText(/^Completed\. It will come back/)).toBeInTheDocument()
  })

  it('noMentorPanelOnLessons', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderAt(`/learn/oop/${first.id}`)
    await answerAll(true)
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }))
    expect(fetchSpy.mock.calls.filter(([u]) => String(u).includes('/ask'))).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /hint/i })).toBeNull()
    expect(screen.queryByRole('complementary', { name: /mentor/i })).toBeNull()
  })

  it('nextPreviousNavigation', () => {
    renderAt(`/learn/oop/${first.id}`)
    expect(screen.queryByRole('link', { name: /^Previous/ })).toBeNull()
    expect(screen.getByRole('link', { name: `Next: ${oop.modules[1].title}` })).toHaveAttribute('href', `/learn/oop/${oop.modules[1].id}`)
  })

  it('unknownModuleShowsNotFound', () => {
    renderAt('/learn/oop/nope')
    expect(screen.getByRole('heading', { name: 'Lesson not found' })).toBeInTheDocument()
  })
})

describe('Learn hub', () => {
  it('learnHubShowsThreeTracksWithProgress', () => {
    localStorage.setItem('algomentor.learn.v1', JSON.stringify({ [first.id]: { bestQuiz: 5, completedAt: 1, reviewStep: 0, nextReviewAt: null } }))
    renderAt('/learn')
    const tracks = screen.getByRole('list', { name: 'Tracks' })
    expect(within(tracks).getAllByRole('listitem')).toHaveLength(3)
    for (const t of TRACKS) expect(within(tracks).getByRole('heading', { name: t.title })).toBeInTheDocument()
    expect(within(tracks).getByText(`1 of ${oop.modules.length} modules`)).toBeInTheDocument()
    expect(within(tracks).getByRole('link', { name: `Continue ${oop.title}` })).toHaveAttribute('href', `/learn/oop/${oop.modules[1].id}`)
    const nav = screen.getByRole('navigation', { name: 'Learn' })
    for (const name of ['OOP', 'Networks', 'DBMS', 'Git', 'Resume projects']) expect(within(nav).getByRole('link', { name })).toBeInTheDocument()
  })

  it('trackPageListsModulesInOrder', () => {
    renderAt('/learn/oop')
    const list = screen.getByRole('list', { name: 'Modules' })
    expect(within(list).getAllByRole('link').map((a) => a.textContent)).toEqual(oop.modules.map((m, i) => expect.stringContaining(`${i + 1}. ${m.title}`)))
  })
})
