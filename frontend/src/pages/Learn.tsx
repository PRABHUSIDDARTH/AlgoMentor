import { Link } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { TrackCard } from '@/components/learn/TrackCard'
import { TRACKS } from '@/content/learn'
import { dueModules } from '@/learn/progress'
import { useLearn } from '@/learn/useLearn'

export default function Learn() {
  const progress = useLearn()
  const due = dueModules()
  return (
    <AppShell>
      <div className="grid content-start gap-7 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader
          eyebrow="Learn"
          title="The core CS interviews ask about."
          summary="Short lessons with a quiz each. Pass a quiz and the module comes back for a quick re-quiz after 1, 3, 7, 21 and 60 days."
        />
        {due.length > 0 && (
          <section aria-label="Due for review" className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-ink bg-cream px-5 py-3.5">
            <p className="text-[14px] font-semibold">{due.length} {due.length === 1 ? 'module' : 'modules'} due for review</p>
            <p className="text-[13px] text-ink-muted">A short re-quiz keeps them fresh.</p>
            <Link to="/today" className="text-[13.5px] font-medium underline underline-offset-[3px]">Review on Today</Link>
          </section>
        )}
        <ul aria-label="Tracks" className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {TRACKS.map((t) => <TrackCard key={t.id} track={t} progress={progress} />)}
        </ul>
        <section aria-labelledby="learn-build" className="grid gap-3">
          <h2 id="learn-build" className="text-[18px] font-semibold">Build and show it</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/git" className="grid gap-1.5 rounded-lg border border-line bg-cream px-5 py-4 hover:border-line-strong">
              <span className="text-[15px] font-semibold">Git challenges</span>
              <span className="text-[13px] leading-relaxed text-ink-muted">Ten real situations in your own repository: conflicts, rebases, reverts, lost branches. You fix them yourself, no AI.</span>
            </Link>
            <Link to="/resume" className="grid gap-1.5 rounded-lg border border-line bg-cream px-5 py-4 hover:border-line-strong">
              <span className="text-[15px] font-semibold">Resume projects</span>
              <span className="text-[13px] leading-relaxed text-ink-muted">Projects that show depth, how to write them up, and a checklist that makes the repository look the part.</span>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
