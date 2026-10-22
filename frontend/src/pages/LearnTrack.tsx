import { Link, useParams } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { LearnNav } from '@/components/learn/LearnNav'
import { ModuleList } from '@/components/learn/ModuleList'
import { ProjectCard } from '@/components/learn/ProjectCard'
import { ProgressBar } from '@/components/practice/ProgressBar'
import { TRACK_BY_ID, type TrackId } from '@/content/learn'
import { PROJECT_BY_ID } from '@/content/learn/projects'
import { useLearn } from '@/learn/useLearn'

export default function LearnTrack() {
  const { trackId = '' } = useParams()
  const track = TRACK_BY_ID.get(trackId as TrackId)
  const progress = useLearn()
  if (!track) {
    return (
      <AppShell>
        <div className="grid content-start gap-3 px-6 py-10 sm:px-10 lg:px-14">
          <h1 className="display text-[28px]">Track not found</h1>
          <Link to="/learn" className="underline underline-offset-[3px]">All tracks</Link>
        </div>
      </AppShell>
    )
  }
  const done = track.modules.filter((m) => progress[m.id]?.completedAt !== undefined).length
  return (
    <AppShell>
      <div className="grid content-start gap-7 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <header className="grid gap-2">
          <p className="eyebrow">Learn · {track.short}</p>
          <h1 className="display text-[32px] leading-tight xl:text-[38px]">{track.title}</h1>
          <p className="max-w-[72ch] text-[14px] leading-relaxed text-ink-muted">{track.summary}</p>
        </header>
        <LearnNav />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid content-start gap-8">
            <section aria-labelledby="track-modules" className="grid content-start gap-3">
              <h2 id="track-modules" className="text-[18px] font-semibold">Modules</h2>
              <ModuleList track={track} progress={progress} />
            </section>
            <section aria-labelledby="track-projects" className="grid content-start gap-3">
              <h2 id="track-projects" className="text-[18px] font-semibold">Projects</h2>
              <p className="max-w-[72ch] text-[13.5px] leading-relaxed text-ink-muted">Build these in your own public repository, in any language. Each one has Git milestones that AlgoMentor checks for you.</p>
              <ul aria-label="Projects" className="grid gap-4 md:grid-cols-3">
                {track.projects.map((id) => <ProjectCard key={id} project={PROJECT_BY_ID.get(id)!} />)}
              </ul>
            </section>
          </div>
          <aside aria-label="Track progress" className="grid content-start gap-3 rounded-lg border border-line bg-sand px-5 py-5">
            <p className="text-[15px] font-semibold">{done} of {track.modules.length} complete</p>
            <ProgressBar value={done / track.modules.length} label={`${track.title} progress`} />
            <p className="text-[12.5px] leading-relaxed text-ink-muted">A module completes when you score 4 of 5 on its quiz and mark it complete.</p>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
