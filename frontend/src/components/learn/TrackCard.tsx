import { Link } from 'react-router'
import { DIAGRAMS } from '@/components/learn/diagrams'
import { ProgressRing } from '@/components/learn/ProgressRing'
import type { Track } from '@/content/learn/types'
import type { LearnProgress } from '@/learn/progress'

/** First module not yet completed, or the first module when the track is finished. */
export function nextModule(track: Track, progress: LearnProgress) {
  return track.modules.find((m) => progress[m.id]?.completedAt === undefined) ?? track.modules[0]
}

export function TrackCard({ track, progress }: { track: Track; progress: LearnProgress }) {
  const done = track.modules.filter((m) => progress[m.id]?.completedAt !== undefined).length
  const next = nextModule(track, progress)
  const verb = done === 0 ? 'Start' : done === track.modules.length ? 'Review' : 'Continue'
  const Diagram = DIAGRAMS[track.modules.find((m) => m.diagram)?.diagram ?? '']
  return (
    <li className="grid content-start gap-3 rounded-lg border border-line bg-sand p-4">
      {Diagram && <div className="flex h-[132px] items-center overflow-hidden rounded-md border border-line bg-cream p-3">{Diagram && <Diagram />}</div>}
      <div className="flex items-start gap-3 px-1">
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="eyebrow">{track.short}</p>
          <h2 className="text-[19px] font-semibold leading-snug">
            <Link to={`/learn/${track.id}`} className="hover:underline hover:underline-offset-[3px]">{track.title}</Link>
          </h2>
        </div>
        <ProgressRing done={done} total={track.modules.length} label={track.short} />
      </div>
      <p className="px-1 text-[13.5px] leading-relaxed text-ink-muted">{track.summary}</p>
      <p className="px-1 font-mono text-[12px] text-ink-muted">{done} of {track.modules.length} modules</p>
      <p className="px-1 text-[13px] text-ink-muted">Next up: {next.title}</p>
      <Link to={`/learn/${track.id}/${next.id}`} className="justify-self-start px-1 text-[13.5px] font-medium underline underline-offset-[3px]">
        {verb}{' '}<span className="sr-only">{track.title}</span>
      </Link>
    </li>
  )
}
