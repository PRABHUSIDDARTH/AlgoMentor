import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { loadTests, scoreTest } from '@/practice/tests'
import { useLevel } from '@/practice/useLevel'

const day = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** Your saved practice tests, and the button that starts a new one. */
export default function Tests() {
  const { level } = useLevel()
  const navigate = useNavigate()
  const tests = useMemo(() => Object.values(loadTests()).sort((a, b) => b.createdAt - a.createdAt), [])
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-7 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader
          eyebrow="Practice"
          title="Practice tests"
          summary="Ten problems in sixty minutes, mixed from revision and new ground at your level. Missed revision problems come back sooner, and weak stages get an extra review."
        >
          <div className="pt-1">
            <Button className="bg-sage font-semibold text-on-sage hover:bg-sage/90" onClick={() => navigate(`/test/new?level=${level}`)}>Generate test</Button>
          </div>
        </PageHeader>
        <section aria-labelledby="tests-list" className="grid max-w-[900px] gap-3">
          <h2 id="tests-list" className="text-[18px] font-semibold">Your tests</h2>
          {tests.length === 0 ? (
            <p className="text-[13.5px] text-ink-muted">No tests yet. Generate one when you have solved a few roadmap problems.</p>
          ) : (
            <ul aria-label="Tests" className="overflow-hidden rounded-lg border border-line bg-cream">
              {tests.map((t) => {
                const { score, max } = scoreTest(t)
                const done = t.finishedAt !== undefined
                return (
                  <li key={t.id} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
                    <span className="w-28 shrink-0 font-mono text-[12px] text-ink-muted">{day(t.createdAt)}</span>
                    <span className="min-w-0 flex-1 text-[14px]">{done ? `${score} of ${max}` : 'In progress'}</span>
                    <Link to={`/test/${t.id}`} className="shrink-0 text-[13.5px] font-medium underline underline-offset-[3px]">
                      {done ? 'Report' : 'Resume'}<span className="sr-only"> for the test on {day(t.createdAt)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}
