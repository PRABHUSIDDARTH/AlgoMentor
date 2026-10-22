import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { DIAGRAMS } from '@/components/learn/diagrams'
import { InterviewQuestions } from '@/components/learn/InterviewQuestions'
import { ModuleList } from '@/components/learn/ModuleList'
import { Quiz } from '@/components/learn/Quiz'
import { ReadingProgress } from '@/components/learn/ReadingProgress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeBlock } from '@/components/workspace/CodeBlock'
import { MODULES } from '@/content/learn'
import { markModuleComplete, PASS_SCORE, recordQuiz } from '@/learn/progress'
import { useLearn } from '@/learn/useLearn'
import { addHeadingIds, extractToc } from '@/learn/toc'
import { splitMarkdown } from '@/lib/markdown'

const LANGS = [
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'cpp', label: 'C++' },
] as const

/** One lesson: reading, diagram, code, quiz and interview questions. No AI on this page. */
export default function Lesson() {
  const { trackId = '', moduleId = '' } = useParams()
  const entry = MODULES.get(moduleId)
  const progress = useLearn()
  const segments = useMemo(() => {
    if (!entry) return []
    const seen = new Map<string, number>()
    return splitMarkdown(entry.lesson.body).segments.map((s) => (s.kind === 'html' ? { ...s, html: addHeadingIds(s.html, seen) } : s))
  }, [entry])
  const toc = useMemo(() => (entry ? extractToc(entry.lesson.body) : []), [entry])

  if (!entry || entry.track.id !== trackId) {
    return (
      <AppShell>
        <div className="grid content-start gap-3 px-6 py-10 sm:px-10 lg:px-14">
          <h1 className="display text-[28px]">Lesson not found</h1>
          <Link to="/learn" className="underline underline-offset-[3px]">All tracks</Link>
        </div>
      </AppShell>
    )
  }

  const { track, lesson, index } = entry
  const p = progress[lesson.id]
  const done = p?.completedAt !== undefined
  const canComplete = !done && (p?.bestQuiz ?? 0) >= PASS_SCORE
  const prev = track.modules[index - 1]
  const next = track.modules[index + 1]
  const Diagram = lesson.diagram ? DIAGRAMS[lesson.diagram] : undefined

  return (
    <AppShell>
      <ReadingProgress />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 px-6 py-8 sm:px-10 lg:px-14 xl:grid-cols-[minmax(0,1fr)_300px] xl:px-20">
        <article className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-7">
          <PageHeader
            crumbs={[{ label: 'Learn', to: '/learn' }, { label: track.short, to: `/learn/${track.id}` }, { label: lesson.title }]}
            eyebrow={`Module ${index + 1} of ${track.modules.length}`}
            title={lesson.title}
          >
            <p className="font-mono text-[12px] text-ink-muted">
              {lesson.minutes} min read{done && p?.completedAt ? ` · Completed ${new Date(p.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
            </p>
          </PageHeader>

          <div className="prose-am max-w-[72ch]">
            {segments.map((s, i) => (s.kind === 'html' ? <div key={i} dangerouslySetInnerHTML={{ __html: s.html }} /> : <CodeBlock key={i} code={s.code} lang={s.lang} />))}
          </div>

          {Diagram && (
            <figure className="max-w-[72ch] rounded-lg border border-line bg-cream p-4">
              <Diagram />
            </figure>
          )}

          {lesson.code && (
            <section aria-labelledby="lesson-code" className="grid max-w-[80ch] grid-cols-[minmax(0,1fr)] gap-2">
              <h2 id="lesson-code" className="text-[18px] font-semibold">In code</h2>
              <Tabs defaultValue="java">
                <TabsList>
                  {LANGS.map((l) => <TabsTrigger key={l.id} value={l.id}>{l.label}</TabsTrigger>)}
                </TabsList>
                {LANGS.map((l) => (
                  <TabsContent key={l.id} value={l.id}>
                    <CodeBlock code={lesson.code![l.id]} lang={l.id} />
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          )}

          <section aria-labelledby="lesson-quiz" className="grid max-w-[72ch] grid-cols-[minmax(0,1fr)] gap-3 rounded-lg border border-line bg-sand px-5 py-5">
            <h2 id="lesson-quiz" className="text-[18px] font-semibold">Check yourself</h2>
            <p className="text-[13px] text-ink-muted">Score {PASS_SCORE} of 5 or better to complete this module.{p?.bestQuiz ? ` Best so far: ${p.bestQuiz} of 5.` : ''}</p>
            <Quiz key={lesson.id} questions={lesson.quiz} onGraded={(score) => recordQuiz(lesson.id, score)} />
          </section>

          <div className="flex flex-wrap items-center gap-3">
            {done ? (
              <p className="text-[14px] font-semibold">Completed. It will come back as a short re-quiz on Today.</p>
            ) : (
              <Button className="bg-sage font-semibold text-on-sage hover:bg-sage/90" disabled={!canComplete} onClick={() => markModuleComplete(lesson.id)}>
                Mark complete
              </Button>
            )}
          </div>

          <div className="max-w-[72ch]"><InterviewQuestions items={lesson.interview} /></div>

          <nav aria-label="Lesson navigation" className="flex max-w-[72ch] flex-wrap justify-between gap-3 border-t border-line pt-5 text-[13.5px]">
            {prev ? <Link to={`/learn/${track.id}/${prev.id}`} className="underline underline-offset-[3px]">Previous: {prev.title}</Link> : <span />}
            {next ? <Link to={`/learn/${track.id}/${next.id}`} className="underline underline-offset-[3px]">Next: {next.title}</Link>
              : <Link to={`/learn/${track.id}`} className="underline underline-offset-[3px]">Back to {track.short}</Link>}
          </nav>
        </article>

        <aside aria-label="Track" className="hidden content-start gap-6 xl:grid xl:sticky xl:top-6 xl:self-start">
          {toc.length > 0 && (
            <nav aria-label="On this page" className="grid gap-1.5">
              <p className="eyebrow">On this page</p>
              {toc.map((t) => (
                <a key={t.id} href={`#${t.id}`} className="border-l border-line-strong py-0.5 pl-3 text-[12.5px] leading-snug text-ink-muted hover:border-ink hover:text-ink">{t.text}</a>
              ))}
            </nav>
          )}
          <div className="grid gap-3">
            <p className="eyebrow">{track.title}</p>
            <ModuleList track={track} progress={progress} currentId={lesson.id} compact />
          </div>
        </aside>
      </div>
    </AppShell>
  )
}
