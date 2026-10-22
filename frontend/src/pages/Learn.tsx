import { Link } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { TrackCard } from '@/components/learn/TrackCard'
import { TRACKS } from '@/content/learn'
import { useLearn } from '@/learn/useLearn'

export default function Learn() {
  const progress = useLearn()
  return (
    <AppShell>
      <div className="grid content-start gap-7 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <header className="grid gap-2">
          <p className="eyebrow">Learn</p>
          <h1 className="display text-[32px] leading-tight xl:text-[38px]">The core CS interviews ask about.</h1>
          <p className="max-w-[72ch] text-[14px] leading-relaxed text-ink-muted">
            Three tracks of short lessons with a quiz each. Pass a quiz and the module comes back for a quick re-quiz after 1, 3, 7, 21 and 60 days.
          </p>
        </header>
        <ul aria-label="Tracks" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
