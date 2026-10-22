import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Quiz } from '@/components/learn/Quiz'
import { MODULES } from '@/content/learn'
import { recordReview, REQUIZ_PASS } from '@/learn/progress'
import { pickRequiz } from '@/learn/quiz'

interface Props {
  moduleId: string
  dateKey: string
  done: boolean
  onDone: () => void
}

/** Today's concept refresher for a completed Learn module: three of its quiz questions. */
export function ModuleRefresher({ moduleId, dateKey, done, onDone }: Props) {
  const id = useId()
  const [graded, setGraded] = useState(false) // keep the results on screen after this session's re-quiz
  const entry = MODULES.get(moduleId)
  if (!entry) return null
  const { track, lesson } = entry
  return (
    <section aria-labelledby={id} className="grid gap-3 rounded-lg border border-line bg-sand px-5 py-4">
      <h2 id={id} className="eyebrow">Concept refresher · {track.title}</h2>
      <p className="text-[15px] font-semibold">{lesson.title}</p>
      {done && <p className="text-[13.5px] text-ink-muted">Refreshed</p>}
      {(!done || graded) && (
        <>
          <p className="text-[13px] text-ink-muted">Three questions from a module you finished. Get {REQUIZ_PASS} right and it comes back later; miss them and it comes back tomorrow.</p>
          <Quiz
            once
            questions={pickRequiz(lesson.quiz, dateKey)}
            onGraded={(score) => {
              setGraded(true)
              recordReview(lesson.id, score >= REQUIZ_PASS)
              onDone()
            }}
          />
        </>
      )}
      <Link to={`/learn/${track.id}/${lesson.id}`} className="text-[13px] underline underline-offset-[3px]">Reread the lesson</Link>
    </section>
  )
}
