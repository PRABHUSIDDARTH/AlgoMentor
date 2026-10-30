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

/** A track's modules in order, each with its state: done, quiz score so far, or not started. Full size is a vertical timeline. */
export function ModuleList({ track, progress, currentId, compact }: Props) {
  return (
    <ol aria-label="Modules" className={cn('grid', compact ? 'gap-0.5' : 'relative gap-2.5 pl-9 before:absolute before:top-3 before:bottom-3 before:left-[13px] before:w-px before:bg-line-strong')}>
      {track.modules.map((m, i) => {
        const p = progress[m.id]
        const done = p?.completedAt !== undefined
        const state = done ? 'Done' : p?.bestQuiz ? `Quiz ${p.bestQuiz}/5` : `${m.minutes} min`
        return (
          <li key={m.id} className="relative">
            {!compact && (
              <span
                aria-hidden="true"
                data-node={done ? 'done' : 'todo'}
                className={cn('absolute top-1/2 -left-9 grid size-[27px] -translate-y-1/2 place-items-center rounded-full border-[1.5px] bg-cream font-mono text-[11px]', done ? 'border-sage bg-sage text-on-sage' : 'border-line-strong text-ink-muted')}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
            )}
            <Link
              to={`/learn/${track.id}/${m.id}`}
              aria-current={m.id === currentId ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 hover:bg-sand/60',
                compact ? 'rounded-md px-2.5 py-1.5 text-[12.5px]' : 'rounded-lg border border-line bg-cream px-4 py-3 text-[14px] hover:border-line-strong',
                m.id === currentId && 'bg-sand shadow-[inset_2px_0_0_var(--sage)]',
              )}
            >
              <span className="min-w-0 flex-1">{i + 1}. {m.title}</span>
              <span className={cn('inline-flex shrink-0 items-center gap-1 font-mono text-[11px]', done ? 'text-ink' : 'text-ink-muted')}>
                {compact && done && <Check className="size-3" aria-hidden="true" />}
                {state}
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
