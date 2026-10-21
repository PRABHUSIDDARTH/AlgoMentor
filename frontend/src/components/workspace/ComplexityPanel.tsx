import type { Complexity } from '@/lib/markdown'

export function ComplexityPanel({ complexity }: { complexity: Complexity }) {
  const cells = [['Time', complexity.time], ['Space', complexity.space]] as const
  return (
    <section aria-label="Complexity" className="grid grid-cols-2 overflow-hidden rounded-lg border border-line">
      {cells.map(([label, cx]) => (
        <div key={label} className="px-3.5 py-3 [&+&]:border-l [&+&]:border-line">
          <p className="eyebrow">{label}</p>
          <p className="mt-1 mb-0.5 font-mono text-[16px] font-medium">{cx.value}</p>
          {cx.reason && <p className="text-[11.5px] text-ink-muted">{cx.reason}</p>}
        </div>
      ))}
    </section>
  )
}
