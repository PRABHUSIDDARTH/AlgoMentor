import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { solveHref } from '@/practice/roadmapView'
import { DifficultyMarker } from '@/components/workspace/Difficulty'
import type { RoadmapProblem } from '@/content/roadmap'
import { clearProblem, recordSolve, type ProblemProgress } from '@/practice/progress'
import { isDue } from '@/practice/schedule'
import { cn } from '@/lib/utils'

export function ProblemRow({ problem, progress }: { problem: RoadmapProblem; progress?: ProblemProgress }) {
  const solved = progress?.status === 'solved'
  const due = solved && isDue(progress.nextReviewAt, Date.now())
  const status = due ? 'Review due' : solved ? (progress.known ? 'Known' : progress.nextReviewAt === null ? 'Mastered' : 'Solved') : ''
  return (
    <li aria-label={problem.title} className="flex items-center gap-3 px-3 py-2.5 [&+&]:border-t [&+&]:border-line">
      <input
        type="checkbox"
        aria-label={`Mark ${problem.title} solved`}
        checked={solved}
        onChange={() => (solved ? clearProblem(problem.id) : recordSolve(problem.id, { hintsUsed: 0 }))}
        className="size-4 shrink-0 accent-[var(--sage)]"
      />
      <span className={cn('min-w-0 flex-1 text-[13.5px] leading-snug break-words sm:truncate', solved && 'text-ink-muted')}>{problem.title}</span>
      <span className="hidden font-mono text-[11px] text-ink-muted sm:inline"><DifficultyMarker difficulty={problem.difficulty} />{problem.difficulty}</span>
      {status && <span className={cn('shrink-0 text-right font-mono text-[11px] sm:w-[84px]', due ? 'font-medium text-ink' : 'text-ink-muted')}>{status}</span>}
      {!status && <span aria-hidden="true" className="hidden sm:block sm:w-[84px]" />}
      <a href={problem.url} target="_blank" rel="noopener noreferrer" aria-label={`${problem.title} on LeetCode`} className="rounded p-1 text-ink-muted hover:text-ink">
        <ExternalLink className="size-3.5" aria-hidden="true" />
      </a>
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
