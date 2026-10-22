import { cn } from '@/lib/utils'

const STATE_TEXT = { complete: 'complete', partial: 'partly done', none: 'no activity' } as const

function label(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** The last 14 days as small squares, each with a text alternative. */
export function StreakStrip({ days }: { days: { dateKey: string; state: 'complete' | 'partial' | 'none' }[] }) {
  return (
    <ol aria-label="Last 14 days" className="flex gap-1.5">
      {days.map((d) => (
        <li key={d.dateKey} title={`${label(d.dateKey)}: ${STATE_TEXT[d.state]}`}>
          <span className="sr-only">{label(d.dateKey)}: {STATE_TEXT[d.state]}</span>
          <span
            aria-hidden="true"
            className={cn('block size-4 rounded-[3px] border', d.state === 'complete' ? 'border-sage bg-sage' : d.state === 'partial' ? 'border-sage bg-sage/35' : 'border-line-strong bg-transparent')}
          />
        </li>
      ))}
    </ol>
  )
}
