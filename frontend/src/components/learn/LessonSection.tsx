import { CodeBlock } from '@/components/workspace/CodeBlock'
import type { LessonSection as Section } from '@/learn/lessonBlocks'
import { Callout } from './Callout'

/** One "##" section of a lesson: the text on the left and its callouts beside it, stacked below the text on narrow screens. */
export function LessonSection({ section }: { section: Section }) {
  const { id, title, segments, callouts } = section
  return (
    <section className="grid gap-x-9 gap-y-4 lg:grid-cols-[minmax(0,68ch)_minmax(280px,1fr)]">
      <div className="prose-am min-w-0">
        <h2 id={id}>{title}</h2>
        {segments.map((s, i) => (s.kind === 'html' ? <div key={i} dangerouslySetInnerHTML={{ __html: s.html }} /> : <CodeBlock key={i} code={s.code} lang={s.lang} />))}
      </div>
      {callouts.length > 0 && (
        <div className="grid min-w-0 content-start gap-3 lg:pt-1.5">
          {callouts.map((c, i) => <Callout key={i} callout={c} />)}
        </div>
      )}
    </section>
  )
}
