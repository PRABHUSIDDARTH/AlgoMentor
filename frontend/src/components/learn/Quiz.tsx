import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { QuizQuestion } from '@/content/learn/types'
import { gradeQuiz } from '@/learn/quiz'
import { cn } from '@/lib/utils'

interface Props {
  questions: QuizQuestion[]
  /** Called once per "Check answers" with the score. */
  onGraded: (score: number) => void
  /** Hides "Try again" (a review re-quiz counts once). */
  once?: boolean
}

/** Multiple-choice questions as labelled radio groups; feedback and the score are announced after checking. */
export function Quiz({ questions, onGraded, once }: Props) {
  const uid = useId()
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1))
  const [results, setResults] = useState<boolean[] | null>(null)
  const complete = answers.every((a) => a >= 0)
  const score = results?.filter(Boolean).length ?? 0

  const check = () => {
    const graded = gradeQuiz(questions, answers)
    setResults(graded.results)
    onGraded(graded.score)
  }
  const retry = () => {
    setAnswers(questions.map(() => -1))
    setResults(null)
  }

  return (
    <div className="grid gap-5">
      <ol className="grid gap-5">
        {questions.map((q, i) => {
          const promptId = `${uid}-${q.id}`
          const result = results?.[i]
          return (
            <li key={q.id} className="grid gap-2.5">
              <div role="radiogroup" aria-labelledby={promptId} className="grid gap-2">
                <p className="flex gap-2 text-[14.5px] font-medium leading-snug">
                  <span aria-hidden="true" className="font-mono text-[12px] leading-[1.6] text-ink-muted">{i + 1}.</span>
                  <span id={promptId}>{q.prompt}</span>
                </p>
                {q.options.map((option, o) => {
                  const chosen = answers[i] === o
                  return (
                    <label
                      key={o}
                      className={cn(
                        'flex cursor-pointer items-start gap-2.5 rounded-md border border-line bg-cream px-3 py-2 text-[13.5px] leading-snug hover:border-line-strong',
                        chosen && 'border-ink',
                        results && o === q.answer && 'border-sage bg-sage/10',
                        results && chosen && o !== q.answer && 'border-danger',
                      )}
                    >
                      <input
                        type="radio"
                        name={promptId}
                        className="mt-0.5 size-4 shrink-0 accent-[var(--sage)]"
                        checked={chosen}
                        disabled={!!results}
                        onChange={() => setAnswers((a) => a.map((x, k) => (k === i ? o : x)))}
                      />
                      <span>{option}</span>
                    </label>
                  )
                })}
              </div>
              {results && (
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  <span className={cn('font-semibold', result ? 'text-ink' : 'text-danger')}>{result ? 'Correct. ' : `Not quite: the answer is "${q.options[q.answer]}". `}</span>
                  {q.why}
                </p>
              )}
            </li>
          )
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        {!results && <Button className="bg-ink text-cream hover:bg-ink/90" disabled={!complete} onClick={check}>Check answers</Button>}
        {results && !once && <Button variant="outline" className="border-ink bg-transparent" onClick={retry}>Try again</Button>}
        {!results && !complete && <span className="text-[12.5px] text-ink-muted">Answer all {questions.length} to check.</span>}
        <p role="status" className="text-[13.5px] font-semibold">{results ? `${score} of ${questions.length} correct` : ''}</p>
      </div>
    </div>
  )
}
