import { Link } from 'react-router'
import { PROBLEMS, STAGE_BY_ID } from '@/content/roadmap'
import { scoreTest, type PracticeTest } from '@/practice/tests'

export function TestReport({ test, onAnother }: { test: PracticeTest; onAnother: () => void }) {
  const s = scoreTest(test)
  const minutes = Math.max(1, Math.round(((test.finishedAt ?? Date.now()) - test.createdAt) / 60_000))
  return (
    <div className="grid content-start gap-6 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
      <header className="grid gap-2">
        <p className="eyebrow">Practice test</p>
        <h1 className="display text-[32px]">Test report</h1>
        <p className="font-mono text-[28px] font-medium">{s.score} / {s.max}</p>
        <p className="text-[13px] text-ink-muted">Finished in {minutes} {minutes === 1 ? 'minute' : 'minutes'} · solved without hints counts 1, with hints 0.5</p>
      </header>
      <section aria-labelledby="by-stage" className="grid max-w-[720px] gap-2">
        <h2 id="by-stage" className="text-[16px] font-semibold">By stage</h2>
        <ul className="overflow-hidden rounded-lg border border-line bg-cream">
          {Object.entries(s.byStage).map(([id, v]) => (
            <li key={id} className="flex justify-between px-4 py-2.5 text-[13.5px] [&+&]:border-t [&+&]:border-line">
              <span>{STAGE_BY_ID.get(id)?.title ?? id}</span>
              <span className="font-mono text-[12px]">{v.got} / {v.of}</span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-label="Weak stages" className="grid max-w-[720px] gap-2">
        <h2 className="text-[16px] font-semibold">Weak stages</h2>
        {s.weakStageIds.length ? (
          <>
            <p className="text-[13px] text-ink-muted">These get an extra review in the next 3 days.</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
              {s.weakStageIds.map((id) => <li key={id}><Link to={`/roadmap/${id}`} className="underline underline-offset-[3px]">Practise {STAGE_BY_ID.get(id)?.title ?? id}</Link></li>)}
            </ul>
          </>
        ) : (
          <p className="text-[13px] text-ink-muted">None. Every stage in this test scored at least half.</p>
        )}
      </section>
      <section aria-labelledby="problems" className="grid max-w-[720px] gap-2">
        <h2 id="problems" className="text-[16px] font-semibold">Problems</h2>
        <ul className="grid gap-1 text-[13.5px]">
          {test.problems.map((p) => (
            <li key={p.problemId} className="flex justify-between gap-4">
              <span>{PROBLEMS.get(p.problemId)?.problem.title}{p.kind === 'revision' ? ' · revision' : ''}</span>
              <span className="font-mono text-[12px] text-ink-muted">{p.result === 'solved' ? 'Solved' : p.result === 'hinted' ? 'With hints' : 'Skipped'}</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex gap-3">
        <Link to="/today" className="rounded-md border border-ink px-4 py-2 text-[13.5px] font-medium">Back to today</Link>
        <button type="button" onClick={onAnother} className="rounded-md bg-sage px-4 py-2 text-[13.5px] font-semibold text-on-sage">Take another test</button>
      </div>
    </div>
  )
}
