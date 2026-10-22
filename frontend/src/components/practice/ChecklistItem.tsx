import { Link } from 'react-router'
import { solveHref } from '@/practice/roadmapView'
import { DifficultyMarker } from '@/components/workspace/Difficulty'
import type { RoadmapProblem } from '@/content/roadmap'
import { cn } from '@/lib/utils'

interface Props {
  problem: RoadmapProblem
  done: boolean
  onToggle: (done: boolean) => void
  note?: string
  extra?: React.ReactNode
}

export function ChecklistItem({ problem, done, onToggle, note, extra }: Props) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 [&+&]:border-t [&+&]:border-line">
      <input type="checkbox" aria-label={`${problem.title} done`} checked={done} onChange={(e) => onToggle(e.target.checked)} className="size-4 shrink-0 accent-[var(--sage)]" />
      <span className={cn('min-w-0 flex-1 text-[14px] leading-snug', done && 'text-ink-muted line-through decoration-ink/30')}>
        {problem.title}
        <span className="mt-0.5 block font-mono text-[11px] text-ink-muted no-underline"><DifficultyMarker difficulty={problem.difficulty} />{problem.difficulty}{note ? ` · ${note}` : ''}</span>
      </span>
      {extra}
      <Link
        to={solveHref(problem)}
        aria-label={`Solve ${problem.title}`}
        className="rounded-md border border-ink px-2.5 py-1 text-[12px] font-medium hover:bg-ink hover:text-cream"
      >
        Solve
      </Link>
    </li>
  )
}
