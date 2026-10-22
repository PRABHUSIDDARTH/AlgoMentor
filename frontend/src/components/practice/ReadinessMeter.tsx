/** A labelled meter (sage on sand) with the percentage also shown as text. */
export function ReadinessMeter({ value, label }: { value: number; label: string }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[13px] text-ink-muted">{label}</span>
        <span className="font-mono text-[15px] font-medium">{value}%</span>
      </div>
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className="h-2.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-sage transition-[width] duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
