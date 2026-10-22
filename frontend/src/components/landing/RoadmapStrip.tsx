import CountUp from '@/components/bits/CountUp'
import { PROBLEMS, STAGES } from '@/content/roadmap'
import { Section } from './Section'

const count = (s: (typeof STAGES)[number]) => s.patterns.reduce((n, p) => n + p.problems.length, 0)
const MAX = Math.max(...STAGES.map(count))

/** The 18 real roadmap stages, each with its problem count. */
export function RoadmapStrip() {
  return (
    <Section id="roadmap" eyebrow="02 · The roadmap" title="A path through every topic interviews ask." className="bg-sand">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="grid content-start gap-4">
          <p className="font-display text-[56px] leading-none">
            <span aria-label={`${PROBLEMS.size} problems`}><CountUp to={PROBLEMS.size} duration={1.4} /></span>
          </p>
          <p className="max-w-[40ch] text-[14px] leading-relaxed text-ink-muted">
            problems across {STAGES.length} stages, from arrays and hashing to dynamic programming. Each stage unlocks as you finish most of the one before, and solved problems return for review after 1, 3, 7, 21 and 60 days.
          </p>
        </div>
        <ol aria-label="Roadmap stages" className="grid gap-x-8 sm:grid-cols-2">
          {STAGES.map((s) => (
            <li key={s.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 border-b border-line py-2 text-[13.5px]">
              <span className="font-mono text-[11.5px] text-ink-muted">{String(s.order).padStart(2, '0')}</span>
              <span className="truncate">{s.title}</span>
              <span className="flex items-center gap-2 font-mono text-[11.5px] text-ink-muted">
                <span aria-hidden="true" className="h-[3px] bg-sage" style={{ width: `${Math.max(8, (count(s) / MAX) * 48)}px` }} />
                {count(s)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
