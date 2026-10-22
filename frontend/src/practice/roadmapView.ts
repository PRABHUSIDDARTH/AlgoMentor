import { STAGES } from '@/content/roadmap'
import { TARGET_WEIGHTS } from '@/content/targets'
import type { LeetCodeProfile } from '@/lib/api'
import { isUnlocked, stageCompletion, type Progress } from './progress'
import type { Target } from './store'

export const KNOWN_TAG_THRESHOLD = 15

/** The stage to work on now: the first unlocked stage that isn't finished. */
export function currentStageId(progress: Progress, unlocks: string[]): string {
  return (STAGES.find((s) => isUnlocked(s.id, progress, unlocks) && stageCompletion(s.id, progress).ratio < 1) ?? STAGES[STAGES.length - 1]).id
}

export function isKeyStage(stageId: string, target: Target): boolean {
  return TARGET_WEIGHTS[target.company][stageId] === 3
}

/** Solved count across a stage's LeetCode topics, from the connected profile. */
export function tagSolves(stageId: string, profile?: LeetCodeProfile): number {
  const stage = STAGES.find((s) => s.id === stageId)
  if (!stage || !profile) return 0
  return profile.topics.filter((t) => stage.leetcodeTags.includes(t.tag)).reduce((n, t) => n + t.solved, 0)
}
