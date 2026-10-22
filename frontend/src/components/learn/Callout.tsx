import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/workspace/CodeBlock'
import type { Callout as CalloutData, CalloutKind } from '@/learn/lessonBlocks'
import type { Segment } from '@/lib/markdown'
import { cn } from '@/lib/utils'

const ACCENT: Record<CalloutKind, string> = {
  key: 'border-l-sage',
  gotcha: 'border-l-danger',
  interview: 'border-l-ink',
  try: 'border-l-sage bg-sand',
  story: 'border-l-line-strong',
}

function Segments({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((s, i) => (s.kind === 'html' ? <div key={i} dangerouslySetInnerHTML={{ __html: s.html }} /> : <CodeBlock key={i} code={s.code} lang={s.lang} />))}
    </>
  )
}

/** A short aside in a lesson: a key idea, a common mistake, an interview angle, a story, or a question to answer before reading on. */
export function Callout({ callout }: { callout: CalloutData }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const { kind, title, body, answer } = callout
  return (
    <div role="note" aria-labelledby={id} data-kind={kind} className={cn('grid gap-2 rounded-lg border border-l-[3px] border-line bg-cream px-4 py-3.5', ACCENT[kind])}>
      <p id={id} className="eyebrow">{title}</p>
      <div className="prose-am grid min-w-0 gap-2 text-[13.5px] leading-relaxed [&_p]:m-0">
        <Segments segments={body} />
      </div>
      {kind === 'try' && answer && (
        <>
          <Button type="button" variant="outline" size="sm" className="justify-self-start" aria-expanded={open} aria-controls={`${id}-answer`} onClick={() => setOpen((o) => !o)}>
            {open ? 'Hide the answer' : 'Show the answer'}
          </Button>
          <div id={`${id}-answer`} hidden={!open} className="prose-am grid min-w-0 gap-2 border-t border-line pt-2 text-[13.5px] leading-relaxed [&_p]:m-0">
            <Segments segments={answer} />
          </div>
        </>
      )}
    </div>
  )
}
