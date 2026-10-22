import { Check } from 'lucide-react'
import { Link } from 'react-router'
import type { Track } from '@/content/learn/types'
import type { LearnProgress } from '@/learn/progress'
import { cn } from '@/lib/utils'

interface Props {
  track: Track
  progress: LearnProgress
  currentId?: string
  compact?: boolean
}

/** A track's modules in order, each with its state: done, quiz score so far, or not started. */
export function ModuleList({ track, progress, currentId, compact }: Props) {
  return (
    <ol aria-label="Modules" className={cn('grid', compact ? 'gap-0.5' : 'overflow-hidden rounded-lg border border-line bg-cream')}>
      {track.modules.map((m, i) => {
        const p = progress[m.id]
        const done = p?.completedAt !== undefined
        const state = done ? 'Done' : p?.bestQuiz ? `Quiz ${p.bestQuiz}/5` : `${m.minutes} min`
        return (
          <li key={m.id} className={cn(!compact && 'border-b border-line last:border-b-0')}>
            <Link
              to={`/learn/${track.id}/${m.id}`}
              aria-current={m.id === currentId ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 hover:bg-sand/60',
                compact ? 'rounded-md px-2.5 py-1.5 text-[12.5px]' : 'px-4 py-3 text-[14px]',
                m.id === currentId && 'bg-sand shadow-[inset_2px_0_0_var(--sage)]',
              )}
            >
              <span className="min-w-0 flex-1">{i + 1}. {m.title}</span>
              <span className={cn('inline-flex shrink-0 items-center gap-1 font-mono text-[11px]', done ? 'text-ink' : 'text-ink-muted')}>
                {done && <Check className="size-3" aria-hidden="true" />}
                {state}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
