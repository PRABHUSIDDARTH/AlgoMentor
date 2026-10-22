import { cn } from '@/lib/utils'

export const STEP_LABELS = ['Nudge', 'Direction', 'Approach', 'Technique', 'Solution'] as const

interface Props {
  /** Hints already shown. */
  seen: number
  /** Index of the hint being written now, if any. */
  current: number | null
  revealed: boolean
  onSelect: (index: number) => void
}

/** Five named steps so learners know how much help the next click gives. */
export function HintStepper({ seen, current, revealed, onSelect }: Props) {
  const filled = current ?? seen - 1
  return (
    <ol aria-label="Hint progress" className="relative mt-1.5 grid grid-cols-5">
      <span aria-hidden="true" className="absolute top-[13px] right-[10%] left-[10%] h-[1.5px] bg-ink/25" />
      <span
        aria-hidden="true"
        className="absolute top-[13px] left-[10%] h-[1.5px] bg-ink transition-[width] duration-200"
        style={{ width: `${Math.max(0, Math.min(filled, 4)) * 20}%` }}
      />
      {STEP_LABELS.map((label, i) => {
        const isSolution = i === 4
        const done = isSolution ? revealed : i < seen
        const active = i === current
        const state = active ? 'current' : done ? 'done' : 'upcoming'
        const marker = (
          <span
            className={cn(
              'grid size-[27px] place-items-center rounded-full border-[1.5px] bg-cream font-mono text-[11px] font-medium',
              state === 'done' && 'border-ink bg-ink text-cream',
              state === 'current' && 'border-sage bg-sage text-on-sage shadow-[0_0_0_4px_rgb(139_154_110/0.25)]',
              state === 'upcoming' && 'border-line-strong',
              isSolution && !revealed && 'border-dashed',
            )}
          >
            {isSolution ? 'S' : i + 1}
          </span>
        )
        return (
          <li key={label} className={cn('relative grid justify-items-center gap-1.5 font-mono text-[10.5px] text-ink-muted', active && 'font-medium text-ink')}>
            {done && !isSolution ? (
              <button type="button" className="rounded-full" aria-label={`Go to hint ${i + 1}`} onClick={() => onSelect(i)}>{marker}</button>
            ) : marker}
            <span>{label}</span>
            <span className="sr-only">{state === 'done' ? 'seen' : state === 'current' ? 'in progress' : 'not yet'}</span>
          </li>
        )
      })}
    </ol>
  )
}
