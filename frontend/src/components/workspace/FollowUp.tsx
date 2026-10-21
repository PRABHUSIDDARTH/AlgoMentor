import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import type { Turn } from '@/lib/api'
import { MAX_FOLLOWUP_TURNS } from '@/state/useMentorSession'
import { AnswerView } from './AnswerView'

const MAX_CHARS = 1000

interface Props {
  turns: Turn[]
  streamingText?: string
  disabled: boolean
  onAsk: (question: string) => void
}

export function FollowUp({ turns, streamingText, disabled, onAsk }: Props) {
  const [question, setQuestion] = useState('')
  const full = turns.length >= MAX_FOLLOWUP_TURNS * 2
  const tooLong = question.length > MAX_CHARS

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!question.trim() || tooLong || disabled || full) return
    onAsk(question.trim())
    setQuestion('')
  }

  return (
    <div className="grid gap-3 border-t border-line pt-3">
      {turns.map((t, i) =>
        t.role === 'user' ? (
          <p key={i} className="justify-self-end rounded-lg bg-cream px-3 py-2 text-[13px]"><span className="sr-only">You asked: </span>{t.text}</p>
        ) : (
          <AnswerView key={i} markdown={t.text} />
        ),
      )}
      {streamingText !== undefined && <AnswerView markdown={streamingText} streaming />}
      <form onSubmit={submit} className="flex gap-2">
        <input
          aria-label="Ask a follow-up"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={full}
          placeholder={full ? 'Follow-up limit reached' : 'Ask a follow-up, e.g. “why not an array?”'}
          className="min-w-0 flex-1 rounded-md border border-line-strong bg-grey px-3 py-2 text-[13px] placeholder:text-ink-muted disabled:opacity-60"
        />
        <Button type="submit" size="sm" className="h-auto bg-ink px-3.5 text-cream hover:bg-ink/90" disabled={disabled || full || tooLong || !question.trim()}>
          Ask
        </Button>
      </form>
      {question.length > MAX_CHARS * 0.8 && (
        <p className={`text-right font-mono text-[11px] ${tooLong ? 'text-danger' : 'text-ink-muted'}`}>{question.length} / {MAX_CHARS}</p>
      )}
      {full && <p className="text-[11.5px] text-ink-muted">You've reached {MAX_FOLLOWUP_TURNS} follow-ups for this problem. Open it again to start a new thread.</p>}
    </div>
  )
}
