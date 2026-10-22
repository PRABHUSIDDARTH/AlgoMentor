import { SHEET_LINKS, type Pattern } from '@/content/roadmap'
import type { Progress } from '@/practice/progress'
import { ProblemRow } from './ProblemRow'

export function PatternBlock({ pattern, progress }: { pattern: Pattern; progress: Progress }) {
  const solved = pattern.problems.filter((q) => progress[q.id]?.status === 'solved').length
  const refs = (Object.keys(SHEET_LINKS) as (keyof typeof SHEET_LINKS)[]).filter((k) => pattern.seeAlso[k])
  const headingId = `pattern-${pattern.id}`
  return (
    <section aria-labelledby={headingId} className="grid gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="text-[16px] font-semibold">{pattern.title}</h2>
        <span className="font-mono text-[11px] text-ink-muted">{solved} / {pattern.problems.length}</span>
      </div>
      <p className="max-w-[72ch] text-[13.5px] leading-relaxed text-ink-muted">{pattern.idea}</p>
      <ul className="overflow-hidden rounded-lg border border-line bg-cream">
        {pattern.problems.map((q) => <ProblemRow key={q.id} problem={q} progress={progress[q.id]} />)}
      </ul>
      {refs.length > 0 && (
        <p className="text-[12px] text-ink-muted">
          Also in:{' '}
          {refs.map((k, i) => (
            <span key={k}>
              {i > 0 && ' · '}
              <a href={SHEET_LINKS[k].url} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-[3px]">
                {SHEET_LINKS[k].name} {pattern.seeAlso[k]}
              </a>
            </span>
          ))}
        </p>
      )}
    </section>
  )
}
