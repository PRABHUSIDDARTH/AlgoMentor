import { Link } from 'react-router'
import { DifficultyMarker } from '@/components/workspace/Difficulty'
import { STAGE_BY_ID } from '@/content/roadmap'
import type { Progress } from '@/practice/progress'
import { isDue } from '@/practice/schedule'

/** Side panel on wide screens: the next problems of the current stage, and today's reviews. */
export function UpNext({ stageId, progress }: { stageId: string; progress: Progress }) {
  const stage = STAGE_BY_ID.get(stageId)
  const next = stage ? stage.patterns.flatMap((p) => p.problems).filter((q) => progress[q.id]?.status !== 'solved').slice(0, 3) : []
  const due = Object.values(progress).filter((p) => p.status === 'solved' && isDue(p.nextReviewAt, Date.now())).length
  return (
    <aside aria-label="Up next" className="sticky top-6 grid content-start gap-4 rounded-lg border border-line bg-sand px-5 py-5">
      <div>
        <p className="eyebrow">Up next</p>
        {stage && <p className="mt-1 text-[14px] font-semibold">{stage.order}. {stage.title}</p>}
      </div>
      {next.length ? (
        <ul className="grid gap-2">
          {next.map((q) => (
            <li key={q.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 text-[13px] leading-snug">{q.title}<span className="block font-mono text-[10.5px] text-ink-muted"><DifficultyMarker difficulty={q.difficulty} />{q.difficulty}</span></span>
              <Link to={`/app?q=${encodeURIComponent(q.slug)}&from=${encodeURIComponent(q.id)}`} aria-label={`Solve ${q.title}`} className="rounded-md border border-ink px-2.5 py-1 text-[12px] font-medium hover:bg-ink hover:text-cream">Solve</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-ink-muted">This stage is complete.</p>
      )}
      <div className="border-t border-line pt-3 text-[13px]">
        <p>{due === 0 ? 'No reviews due today.' : `${due} ${due === 1 ? 'review' : 'reviews'} due today.`}</p>
        <Link to="/today" className="text-ink underline underline-offset-[3px]">Open today's plan</Link>
      </div>
    </aside>
  )
}
