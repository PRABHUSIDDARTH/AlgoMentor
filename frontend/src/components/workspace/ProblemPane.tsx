import { ChevronDown, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { splitMarkdown } from '@/lib/markdown'
import { cn } from '@/lib/utils'
import type { ProblemContext } from '@/state/useMentorSession'

interface Props {
  problem: ProblemContext
  onEdit: (text: string) => void
  className?: string
}

export function Statement({ markdown }: { markdown: string }) {
  const { segments } = useMemo(() => splitMarkdown(markdown), [markdown])
  return (
    <div className="prose-am">
      {segments.map((s, i) =>
        s.kind === 'html' ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: s.html }} />
        ) : (
          <pre key={i} className="mb-3 overflow-x-auto rounded-[7px] border border-line bg-grey px-3.5 py-3 font-mono text-[12px] leading-[1.7]">{s.code}</pre>
        ),
      )}
    </div>
  )
}

export function ProblemPane({ problem, onEdit, className }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(problem.statement)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <section aria-labelledby="problem-title" className={cn('min-w-0 px-6 py-5 md:px-7', className)}>
      <div className="flex items-start gap-2">
        <h1 id="problem-title" className="display flex-1 text-[26px] leading-tight">{problem.title}</h1>
        <Button variant="ghost" size="icon" className="md:hidden" aria-expanded={!collapsed} aria-label={collapsed ? 'Show problem' : 'Hide problem'} onClick={() => setCollapsed((c) => !c)}>
          <ChevronDown className={cn('size-4 transition-transform', collapsed && '-rotate-90')} aria-hidden="true" />
        </Button>
      </div>
      <div data-testid="problem-meta" className="mt-1.5 mb-4 flex flex-wrap items-center gap-x-3.5 gap-y-1 border-b border-line pb-3.5 text-[12px] text-ink-muted">
        {problem.difficulty && <span>{problem.difficulty}</span>}
        {problem.tags.length > 0 && <span>{problem.tags.join(' · ')}</span>}
        {problem.url && (
          <a href={problem.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink underline underline-offset-[3px]">
            View on LeetCode <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        )}
        {!editing && (
          <button type="button" className="text-ink underline underline-offset-[3px]" onClick={() => { setDraft(problem.statement); setEditing(true) }}>
            Edit statement
          </button>
        )}
      </div>
      <div className={cn(collapsed && 'max-md:hidden')}>
        {editing ? (
          <div className="grid gap-2.5">
            <textarea
              aria-label="Problem statement"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[260px] w-full rounded-[7px] border border-line-strong bg-grey p-3 font-mono text-[12.5px] leading-relaxed"
            />
            <div className="flex gap-2">
              <Button className="bg-sage font-semibold text-on-sage hover:bg-sage/90" onClick={() => { onEdit(draft); setEditing(false) }} disabled={!draft.trim()}>
                Save statement
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
            <p className="text-[11.5px] text-ink-muted">Saving starts this problem over: hints, explanation and solution are cleared.</p>
          </div>
        ) : (
          <Statement markdown={problem.statement} />
        )}
      </div>
    </section>
  )
}
