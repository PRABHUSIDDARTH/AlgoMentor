import { Link } from 'react-router'
import { DIAGRAMS } from '@/components/learn/diagrams'
import { TRACKS } from '@/content/learn'
import { Section } from './Section'

/** The four Learn tracks, each with one of its own diagrams. */
export function LearnTracks() {
  const lessons = TRACKS.reduce((n, t) => n + t.modules.length, 0)
  const projects = TRACKS.reduce((n, t) => n + t.projects.length, 0)
  return (
    <Section id="learn" eyebrow="03 · Learn" title="The core CS behind the coding round.">
      <p className="mb-6 max-w-[72ch] text-[14px] leading-relaxed text-ink-muted">
        {lessons} short lessons, each with a quiz and interview questions, and {projects} projects you build in your own repository.
      </p>
      <ul aria-label="Learn tracks" className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {TRACKS.map((t) => {
          const Diagram = DIAGRAMS[t.modules.find((m) => m.diagram)?.diagram ?? '']
          return (
            <li key={t.id} className="grid content-start gap-3 rounded-lg border border-line bg-cream p-4">
              <div className="flex h-[150px] items-center overflow-hidden rounded-md border border-line bg-sand p-3">{Diagram && <Diagram />}</div>
              <h3 className="text-[16px] font-semibold"><Link to={`/learn/${t.id}`} className="hover:underline hover:underline-offset-[3px]">{t.title}</Link></h3>
              <p className="font-mono text-[11.5px] text-ink-muted">{t.modules.length} lessons · {t.projects.length} projects</p>
              <p className="text-[13px] leading-relaxed text-ink-muted">Starts with “{t.modules[0].title}”.</p>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
