import { AppShell } from '@/components/AppShell'
import { StageCard } from '@/components/practice/StageCard'
import { UpNext } from '@/components/practice/UpNext'
import { PROBLEMS, STAGES } from '@/content/roadmap'
import { COMPANY_LABEL, ROLE_LABEL } from '@/content/targets'
import type { LeetCodeProfile } from '@/lib/api'
import { isUnlocked, markStageKnown, stageCompletion, unlockStage } from '@/practice/progress'
import { currentStageId, isKeyStage, KNOWN_TAG_THRESHOLD, tagSolves } from '@/practice/roadmapView'
import { useProgress } from '@/practice/useProgress'
import { useSettings, useStats } from '@/practice/useSettings'

export default function Roadmap() {
  const { progress, unlocks } = useProgress()
  const [settings] = useSettings()
  const stats = useStats()
  const profile = settings.leetcode ? (stats.leetcode?.data as LeetCodeProfile | undefined) : undefined
  const current = currentStageId(progress, unlocks)
  const solvedTotal = Object.values(progress).filter((p) => p.status === 'solved').length

  return (
    <AppShell>
      <div className="grid gap-6 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <header className="grid gap-2">
          <p className="eyebrow">Your DSA roadmap</p>
          <h1 className="display text-[32px] leading-tight xl:text-[38px]">18 stages, one concept at a time.</h1>
          <p className="max-w-[72ch] text-[14px] leading-relaxed text-ink-muted">
            Each stage builds on the last. Solved problems come back for review after 1, 3, 7, 21 and 60 days, so you keep what you learn.
          </p>
          <p className="font-mono text-[12px] text-ink-muted">
            {solvedTotal} of {PROBLEMS.size} solved · Target: {COMPANY_LABEL[settings.target.company]} · {ROLE_LABEL[settings.target.role]}
          </p>
        </header>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ol aria-label="Roadmap stages" className="grid">
          {STAGES.map((stage, i) => {
            const c = stageCompletion(stage.id, progress)
            return (
              <StageCard
                key={stage.id}
                stage={stage}
                previousTitle={STAGES[i - 1]?.title}
                solved={c.solved}
                total={c.total}
                unlocked={isUnlocked(stage.id, progress, unlocks)}
                current={stage.id === current}
                key3={isKeyStage(stage.id, settings.target)}
                target={settings.target}
                offerKnown={c.ratio < 1 && tagSolves(stage.id, profile) >= KNOWN_TAG_THRESHOLD}
                onUnlock={() => unlockStage(stage.id)}
                onKnown={() => markStageKnown(stage.id)}
              />
            )
          })}
        </ol>
        <div className="hidden xl:block"><UpNext stageId={current} progress={progress} /></div>
        </div>
      </div>
    </AppShell>
  )
}
