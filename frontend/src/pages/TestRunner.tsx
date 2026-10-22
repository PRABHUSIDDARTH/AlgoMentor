import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { Countdown } from '@/components/practice/Countdown'
import { TestReport } from '@/components/practice/TestReport'
import { Button } from '@/components/ui/button'
import { MentorPanel } from '@/components/workspace/MentorPanel'
import { ProblemPane } from '@/components/workspace/ProblemPane'
import { PROBLEMS, STAGES } from '@/content/roadmap'
import { cn } from '@/lib/utils'
import { isUnlocked, loadProgress, loadUnlocks } from '@/practice/progress'
import { finishTest, generateTest, loadTests, saveTest, type PracticeTest, type TestResult } from '@/practice/tests'
import { useMentorSession } from '@/state/useMentorSession'

const RESULT_TEXT: Record<TestResult, string> = { solved: 'Solved', hinted: 'With hints', skipped: 'Skipped' }

/** /test/new builds a test (level from ?level=) and redirects to /test/:id. */
function NewTest() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const progress = loadProgress()
    const unlocks = loadUnlocks()
    const open = STAGES.filter((s) => isUnlocked(s.id, progress, unlocks)).map((s) => s.id)
    const level = Math.min(10, Math.max(1, Number(params.get('level')) || 1))
    const t = generateTest(level, progress, open, Math.floor(Math.random() * 2 ** 31))
    if ('error' in t) setError(t.error)
    else {
      saveTest(t)
      navigate(`/test/${t.id}`, { replace: true })
    }
  }, [navigate, params])
  return (
    <AppShell>
      <div className="grid content-start gap-3 px-6 py-10 sm:px-10 lg:px-14">
        <h1 className="display text-[28px]">{error ? "Not enough to test yet" : 'Building your test…'}</h1>
        {error && <p role="alert" className="max-w-[60ch] text-[14px] text-ink-muted">{error}</p>}
        {error && <Link to="/roadmap" className="underline underline-offset-[3px]">Open the roadmap</Link>}
      </div>
    </AppShell>
  )
}

export default function TestRunner() {
  const { testId = '' } = useParams()
  if (testId === 'new') return <NewTest />
  return <Runner key={testId} testId={testId} />
}

function Runner({ testId }: { testId: string }) {
  const navigate = useNavigate()
  const [test, setTest] = useState<PracticeTest | undefined>(() => loadTests()[testId])
  const [selected, setSelected] = useState(() => Math.max(0, test?.problems.findIndex((p) => !p.result) ?? 0))
  const session = useMentorSession()
  const current = test?.problems[selected]
  const entry = current ? PROBLEMS.get(current.problemId) : undefined

  // Which test problem the session has finished opening; until then its state belongs to the last one.
  const [openedFor, setOpenedFor] = useState<string | null>(null)
  useEffect(() => {
    if (!entry || test?.finishedAt) return
    const id = entry.problem.id
    setOpenedFor(null)
    void session.openProblem(entry.problem.url).then(() => setOpenedFor(id))
  }, [entry?.problem.url]) // eslint-disable-line react-hooks/exhaustive-deps

  // The session only knows the open problem, so remember help per test problem as soon as it's seen.
  const assistedNow = !!current && openedFor === current.problemId && session.assisted
  useEffect(() => {
    if (!test || !assistedNow || test.problems[selected]?.assisted) return
    const next = { ...test, problems: test.problems.map((p, i) => (i === selected ? { ...p, assisted: true } : p)) }
    saveTest(next)
    setTest(next)
  }, [assistedNow, selected, test])

  if (!test) {
    return (
      <AppShell>
        <div className="grid content-start gap-3 px-6 py-10 sm:px-10 lg:px-14">
          <h1 className="display text-[28px]">Test not found</h1>
          <Link to="/today" className="underline underline-offset-[3px]">Back to today</Link>
        </div>
      </AppShell>
    )
  }
  if (test.finishedAt) return <AppShell><TestReport test={test} onAnother={() => navigate('/test/new')} /></AppShell>

  const update = (next: PracticeTest) => {
    saveTest(next)
    setTest(next)
  }
  const record = (result: TestResult) => {
    const problems = test.problems.map((p, i) => (i === selected ? { ...p, result } : p))
    update({ ...test, problems })
    const nextOpen = problems.findIndex((p, i) => i > selected && !p.result)
    if (nextOpen >= 0) setSelected(nextOpen)
  }
  const finish = () => setTest(finishTest(test))
  const answered = test.problems.filter((p) => p.result).length

  return (
    <AppShell>
      <div className="grid md:h-full md:grid-cols-[260px_minmax(0,1fr)] md:overflow-hidden">
        <aside aria-label="Test" className="grid content-start gap-4 border-b border-line bg-sand px-4 py-5 md:overflow-y-auto md:border-r md:border-b-0">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Practice test</p>
            <Countdown endsAt={test.createdAt + test.durationMin * 60_000} />
          </div>
          <p className="font-mono text-[11.5px] text-ink-muted">{answered} of {test.problems.length} answered</p>
          <ol aria-label="Test problems" className="grid gap-1">
            {test.problems.map((p, i) => {
              const q = PROBLEMS.get(p.problemId)!.problem
              return (
                <li key={p.problemId}>
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    aria-current={i === selected ? 'true' : undefined}
                    className={cn('grid w-full gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-cream/60', i === selected && 'bg-cream shadow-[inset_2px_0_0_var(--sage)]')}
                  >
                    <span className="text-[12.5px] font-medium">{i + 1}. {q.title}</span>
                    <span className="font-mono text-[10.5px] text-ink-muted">{q.difficulty}{p.kind === 'revision' ? ' · revision' : ''}{p.result ? ` · ${RESULT_TEXT[p.result]}` : ''}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <Button variant="outline" className="border-ink bg-transparent" onClick={finish}>Finish test</Button>
        </aside>
        <div className="grid min-h-0 md:grid-rows-[auto_minmax(0,1fr)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
            <span className="text-[13px] text-ink-muted">Problem {selected + 1} of {test.problems.length}</span>
            <span className="flex-1" />
            <Button className="bg-ink text-cream hover:bg-ink/90" onClick={() => record(current?.assisted || assistedNow ? 'hinted' : 'solved')}>Mark solved</Button>
            <Button variant="ghost" onClick={() => record('skipped')}>Skip</Button>
          </div>
          {session.problem ? (
            <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
              <div className="border-b border-line lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
                <ProblemPane key={session.problem.key} problem={session.problem} onEdit={session.editStatement} />
              </div>
              <div className="bg-sand lg:min-h-0 lg:overflow-y-auto"><MentorPanel key={session.problem.key} session={session} /></div>
            </div>
          ) : (
            <p role="status" className="px-6 py-8 text-[13px] text-ink-muted">{session.error?.message ?? 'Loading the problem…'}</p>
          )}
        </div>
      </div>
    </AppShell>
  )
}
