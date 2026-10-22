import { STAGES, type RoadmapProblem } from '@/content/roadmap'
import { weightsFor } from '@/content/targets'
import type { LeetCodeProfile } from '@/lib/api'
import { isUnlocked, stageCompletion, type Progress } from './progress'
import type { Target } from './store'

export const KNOWN_TAG_THRESHOLD = 15

/** The stage to work on now: the first unlocked stage that isn't finished. */
export function currentStageId(progress: Progress, unlocks: string[]): string {
  return (STAGES.find((s) => isUnlocked(s.id, progress, unlocks) && stageCompletion(s.id, progress).ratio < 1) ?? STAGES[STAGES.length - 1]).id
}

export function isKeyStage(stageId: string, target: Target): boolean {
  return weightsFor(target)[stageId] === 3
}

/** Solved count across a stage's LeetCode topics, from the connected profile. */
export function tagSolves(stageId: string, profile?: LeetCodeProfile): number {
  const stage = STAGES.find((s) => s.id === stageId)
  if (!stage || !profile) return 0
  return profile.topics.filter((t) => stage.leetcodeTags.includes(t.tag)).reduce((n, t) => n + t.solved, 0)
}

/** Workspace link for a roadmap problem: its LeetCode URL (which the workspace imports) plus its roadmap id. */
export function solveHref(problem: Pick<RoadmapProblem, 'url' | 'id'>): string {
  return `/app?q=${encodeURIComponent(problem.url)}&from=${encodeURIComponent(problem.id)}`
}
