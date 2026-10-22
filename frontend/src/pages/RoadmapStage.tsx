import { Link, useParams } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { PatternBlock } from '@/components/practice/PatternBlock'
import { ProgressBar } from '@/components/practice/ProgressBar'
import { STAGE_BY_ID } from '@/content/roadmap'
import { isUnlocked, stageCompletion, unlockStage } from '@/practice/progress'
import { useProgress } from '@/practice/useProgress'

export default function RoadmapStage() {
  const { stageId = '' } = useParams()
  const stage = STAGE_BY_ID.get(stageId)
  const { progress, unlocks } = useProgress()

  if (!stage) {
    return (
      <AppShell>
        <div className="grid gap-3 px-6 py-10 sm:px-10 lg:px-14">
          <h1 className="display text-[28px]">Stage not found</h1>
          <Link to="/roadmap" className="underline underline-offset-[3px]">Back to the roadmap</Link>
        </div>
      </AppShell>
    )
  }
  const c = stageCompletion(stage.id, progress)
  const unlocked = isUnlocked(stage.id, progress, unlocks)

  return (
    <AppShell>
      <div className="grid gap-7 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader
          crumbs={[{ label: 'Roadmap', to: '/roadmap' }, { label: stage.title }]}
          eyebrow={`Stage ${stage.order} of 18`}
          title={stage.title}
          summary={stage.summary}
        >
          <p className="font-mono text-[12px] text-ink-muted">{c.solved} of {c.total} solved</p>
          <ProgressBar value={c.ratio} label={`${stage.title} progress`} className="max-w-[420px]" />
          {!unlocked && (
            <p className="text-[12.5px] text-ink-muted">
              This stage is locked until you finish 70% of the previous one.{' '}
              <button type="button" className="text-ink underline underline-offset-[3px]" onClick={() => unlockStage(stage.id)}>Unlock it anyway</button>
            </p>
          )}
        </PageHeader>
        <section aria-labelledby="concepts" className="grid max-w-[1180px] gap-2">
          <h2 id="concepts" className="eyebrow">Concepts</h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13.5px]">
            {stage.concepts.map((k) => <li key={k} className="before:mr-2 before:text-ink-muted before:content-['·']">{k}</li>)}
          </ul>
        </section>
        <div className="grid max-w-[1180px] gap-8">
          {stage.patterns.map((p) => <PatternBlock key={p.id} pattern={p} progress={progress} />)}
        </div>
      </div>
    </AppShell>
  )
}
