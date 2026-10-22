import { Link } from 'react-router'
import { ProgressBar } from '@/components/practice/ProgressBar'
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
  return (
    <li className="grid content-start gap-3 rounded-lg border border-line bg-sand px-5 py-5">
      <p className="eyebrow">{track.short}</p>
      <h2 className="text-[19px] font-semibold leading-snug">
        <Link to={`/learn/${track.id}`} className="hover:underline hover:underline-offset-[3px]">{track.title}</Link>
      </h2>
      <p className="text-[13.5px] leading-relaxed text-ink-muted">{track.summary}</p>
      <ProgressBar value={done / track.modules.length} label={`${track.title} progress`} />
      <p className="font-mono text-[12px] text-ink-muted">{done} of {track.modules.length} modules</p>
      <p className="text-[13px] text-ink-muted">Next up: {next.title}</p>
      <Link to={`/learn/${track.id}/${next.id}`} className="justify-self-start text-[13.5px] font-medium underline underline-offset-[3px]">
        {verb}{' '}<span className="sr-only">{track.title}</span>
      </Link>
    </li>
  )
}
