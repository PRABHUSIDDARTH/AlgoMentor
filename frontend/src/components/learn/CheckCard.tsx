import { Check, X } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { CheckRecord } from '@/learn/repos'

interface Props {
  title: string
  href: string
  record?: CheckRecord
  busy: boolean
  disabled: boolean
  onCheck: () => void
}

const day = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** One Git milestone: its status, what the last check found, and a button to check again. */
export function CheckCard({ title, href, record, busy, disabled, onCheck }: Props) {
  const everPassed = record?.passedAt !== undefined
  const failingNow = !!record && !record.passed
  const status = everPassed ? `Passed ${day(record!.passedAt!)}` : record ? 'Not yet' : 'Not checked'
  return (
    <li className="grid gap-2 border-b border-line px-4 py-3.5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Link to={href} className="min-w-0 flex-1 basis-40 text-[14px] font-medium underline-offset-[3px] hover:underline">{title}</Link>
        <Button variant="outline" size="sm" className="border-line-strong bg-transparent" disabled={disabled || busy} aria-label={`Check ${title}`} onClick={onCheck}>
          {busy ? 'Checking…' : 'Check'}
        </Button>
      </div>
      <p className="font-mono text-[11.5px] text-ink-muted">
        <span className={everPassed ? 'text-ink' : undefined}>{status}</span>
        {everPassed && failingNow && <span className="text-danger"> · Now failing</span>}
      </p>
      {record?.error && <p className="text-[12.5px] leading-relaxed text-danger">{record.error}</p>}
      {record && !record.error && record.details.length > 0 && (
        <ul className="grid gap-1">
          {record.details.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-muted">
              {d.ok ? <Check className="mt-0.5 size-3.5 shrink-0 text-ink" aria-hidden="true" /> : <X className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden="true" />}
              <span className="sr-only">{d.ok ? 'Done: ' : 'Missing: '}</span>
              <span>{d.text}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
