import { inlineMarkdown } from '@/lib/markdown'

/** The opening of a lesson: why it matters, in one concrete paragraph, beside what to take away. */
export function LessonIntro({ hook, keyPoints }: { hook?: string; keyPoints?: string[] }) {
  if (!hook && !keyPoints?.length) return null
  return (
    <section aria-labelledby="lesson-why" className="grid gap-x-10 gap-y-5 rounded-lg border border-line bg-sand px-6 py-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-2">
        <h2 id="lesson-why" className="eyebrow">Why this matters</h2>
        {hook && <p className="text-[16.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineMarkdown(hook) }} />}
      </div>
      {keyPoints && keyPoints.length > 0 && (
        <div className="grid content-start gap-2">
          <p className="eyebrow">Key points</p>
          <ul aria-label="Key points" className="grid gap-2.5">
            {keyPoints.map((k, i) => (
              <li key={k} className="grid grid-cols-[22px_minmax(0,1fr)] gap-2 text-[14px] leading-relaxed">
                <span aria-hidden="true" className="font-mono text-[12px] leading-[1.7] text-ink-muted">{String(i + 1).padStart(2, '0')}</span>
                <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(k) }} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
