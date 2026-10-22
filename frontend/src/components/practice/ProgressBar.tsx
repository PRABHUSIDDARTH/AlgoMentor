import { cn } from '@/lib/utils'

/** A thin bar with its value also given as text by the caller. */
export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={cn('h-1.5 overflow-hidden rounded-full bg-line', className)}>
      <div className="h-full rounded-full bg-sage transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  )
}
