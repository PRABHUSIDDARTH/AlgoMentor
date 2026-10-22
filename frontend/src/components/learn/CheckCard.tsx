import { Link } from 'react-router'
import { CheckResultView } from '@/components/learn/CheckResultView'
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

/** One Git milestone: its status, what the last check found, and a button to check again. */
export function CheckCard({ title, href, record, busy, disabled, onCheck }: Props) {
  return (
    <li className="grid gap-2 border-b border-line px-4 py-3.5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Link to={href} className="min-w-0 flex-1 basis-40 text-[14px] font-medium underline-offset-[3px] hover:underline">{title}</Link>
        <Button variant="outline" size="sm" className="border-line-strong bg-transparent" disabled={disabled || busy} aria-label={`Check ${title}`} onClick={onCheck}>
          {busy ? 'Checking…' : 'Check'}
        </Button>
      </div>
      <CheckResultView record={record} />
    </li>
  )
}
