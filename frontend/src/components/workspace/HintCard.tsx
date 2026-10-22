import { cn } from '@/lib/utils'
import { AnswerView } from './AnswerView'

/** The model starts each hint with "**Hint N:**"; the card header already says that. */
export function hintBody(text: string): string {
  return text.replace(/^\s*\*\*Hint\s+\d+:?\*\*:?\s*/i, '')
}

export function HintCard({ index, text, state }: { index: number; text: string; state: 'past' | 'latest' | 'writing' }) {
  return (
    <article
      id={`hint-${index}`}
      className={cn(
        'animate-in fade-in-0 rounded-lg border px-4 py-3.5 duration-150',
        state === 'past' && 'border-line bg-transparent text-ink-muted',
        state === 'latest' && 'border-line bg-cream',
        state === 'writing' && 'border-ink bg-cream',
      )}
    >
      <header className="mb-2 flex justify-between font-mono text-[11px] font-medium text-ink-muted">
        <span>Hint {index + 1}</span>
        {state === 'past' && <span>read</span>}
        {state === 'writing' && <span>writing…</span>}
      </header>
      <AnswerView markdown={hintBody(text)} streaming={state === 'writing'} />
    </article>
  )
}
