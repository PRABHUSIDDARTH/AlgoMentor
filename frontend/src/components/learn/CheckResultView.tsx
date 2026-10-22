import { Check, X } from 'lucide-react'
import type { CheckRecord } from '@/learn/repos'

/** The findings of a check, each marked done or missing (with text for screen readers, not colour alone). */
export function CheckDetailsList({ details }: { details: { ok: boolean; text: string }[] }) {
  if (!details.length) return null
  return (
    <ul className="grid gap-1">
      {details.map((d, i) => (
        <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-muted">
          {d.ok ? <Check className="mt-0.5 size-3.5 shrink-0 text-ink" aria-hidden="true" /> : <X className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden="true" />}
          <span className="sr-only">{d.ok ? 'Done: ' : 'Missing: '}</span>
          <span>{d.text}</span>
        </li>
      ))}
    </ul>
  )
}

const day = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** The status line and findings of a check: "Passed Oct 22", "Not yet", or "Passed Oct 1 · Now failing" with why. */
export function CheckResultView({ record }: { record?: CheckRecord }) {
  const everPassed = record?.passedAt !== undefined
  const failingNow = !!record && !record.passed
  const status = everPassed ? `Passed ${day(record!.passedAt!)}` : record ? 'Not yet' : 'Not checked'
  return (
    <>
      <p className="font-mono text-[11.5px] text-ink-muted">
        <span className={everPassed ? 'text-ink' : undefined}>{status}</span>
        {everPassed && failingNow && <span className="text-danger"> · Now failing</span>}
      </p>
      {record?.error && <p className="text-[12.5px] leading-relaxed text-danger">{record.error}</p>}
      {record && !record.error && <CheckDetailsList details={record.details} />}
    </>
  )
}
