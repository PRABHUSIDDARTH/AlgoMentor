import { PROBLEMS, STAGES } from '@/content/roadmap'
import { COMPANY_LABEL, READINESS_BAR, ROLE_MULTIPLIER, TARGET_WEIGHTS } from '@/content/targets'
import type { LeetCodeProfile } from '@/lib/api'
import { localDateKey, type Day } from './daily'
import { isUnlocked, stageCompletion, type Progress, type ReviewOutcome } from './progress'
import { DAY_MS } from './schedule'
import type { Target } from './store'

/** Spec §7 weights; each part is already scaled to its weight. */
export const WEIGHTS = { coverage: 35, difficulty: 20, retention: 15, tests: 15, consistency: 10, external: 5 } as const
export type Component = keyof typeof WEIGHTS
export type ScoreParts = Record<Component, number>

export type LevelInput = {
  progress: Progress
  /** Stages unlocked by hand (advice only points at stages the learner can open). */
  unlocks: string[]
  target: Target
  /** Finished tests, any order. */
  tests: { score: number; finishedAt: number }[]
  days: Record<string, Day>
  reviewLog: ReviewOutcome[]
  leetcode?: LeetCodeProfile
  now: number
}

const THRESHOLDS = [8, 15, 24, 34, 44, 54, 64, 75, 87]
const MEDIUM_PLUS_HARD_TARGET = 0.6
const HARD_TARGET = 0.1
const EXTERNAL_CAP = 400

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

function fractions(input: LevelInput): Record<Component, number> {
  const { progress, target, now } = input
  const weights = TARGET_WEIGHTS[target.company]
  let have = 0
  let want = 0
  for (const s of STAGES) {
    const c = stageCompletion(s.id, progress)
    have += (weights[s.id] ?? 0) * c.solved
    want += (weights[s.id] ?? 0) * c.total
  }
  const solved = Object.keys(progress).filter((id) => progress[id].status === 'solved').map((id) => PROBLEMS.get(id)!.problem.difficulty)
  const hard = solved.filter((d) => d === 'Hard').length
  const mh = solved.filter((d) => d !== 'Easy').length
  const hardTarget = HARD_TARGET * ROLE_MULTIPLIER[target.role]
  const difficulty = solved.length ? 0.5 * clamp01(mh / solved.length / MEDIUM_PLUS_HARD_TARGET) + 0.5 * clamp01(hard / solved.length / hardTarget) : 0

  const recent = input.reviewLog.filter((r) => r.at > now - 30 * DAY_MS)
  const retention = recent.length ? recent.filter((r) => r.passed).length / recent.length : 0

  const last3 = [...input.tests].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 3)
  const tests = last3.length ? last3.reduce((n, t) => n + t.score, 0) / last3.length / 10 : 0

  let active = 0
  for (let i = 0; i < 14; i++) {
    if ((input.days[localDateKey(new Date(now - i * DAY_MS))]?.completedIds.length ?? 0) > 0) active++
  }

  return {
    coverage: want ? have / want : 0,
    difficulty,
    retention,
    tests,
    consistency: active / 14,
    external: clamp01((input.leetcode?.solved.total ?? 0) / EXTERNAL_CAP),
  }
}

export function levelScore(input: LevelInput): { total: number; parts: ScoreParts } {
  const f = fractions(input)
  const parts = Object.fromEntries((Object.keys(WEIGHTS) as Component[]).map((k) => [k, f[k] * WEIGHTS[k]])) as ScoreParts
  return { total: Object.values(parts).reduce((a, b) => a + b, 0), parts }
}

export function levelFor(total: number): number {
  return 1 + THRESHOLDS.filter((t) => total >= t).length
}

/** Score as a percentage of the target's bar, capped at 100. */
export function readiness(total: number, target: Target): number {
  return Math.min(100, Math.round((total / READINESS_BAR[target.company][target.role]) * 100))
}

/** Up to 3 concrete next steps, for the components with the largest weighted shortfall. */
export function topGaps(input: LevelInput): { component: Component; action: string }[] {
  const { parts } = levelScore(input)
  const shortfall = (Object.keys(WEIGHTS) as Component[])
    .map((k) => ({ k, gap: WEIGHTS[k] - parts[k] }))
    .filter((x) => x.gap > 0.01)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
  return shortfall.map(({ k }) => ({ component: k, action: action(k, input) }))
}

function action(k: Component, input: LevelInput): string {
  const { progress, target, now } = input
  switch (k) {
    case 'coverage': {
      const weights = TARGET_WEIGHTS[target.company]
      // Only stages the learner can open now and hasn't reached 70% in; prefer the target's key stages.
      const open = STAGES.filter((s) => isUnlocked(s.id, progress, input.unlocks))
        .map((s) => ({ s, c: stageCompletion(s.id, progress), w: weights[s.id] ?? 0 }))
        .filter((x) => x.c.ratio < 0.7)
      const pick = open.sort((a, b) => b.w - a.w || a.s.order - b.s.order)[0]
      if (!pick) return 'Unlock the next stage on the roadmap'
      const n = Math.max(1, Math.ceil(pick.c.total * 0.7) - pick.c.solved)
      const key = pick.w === 3 ? ` (key for ${COMPANY_LABEL[target.company]})` : ''
      return `${pick.s.title}: solve ${n} more ${n === 1 ? 'problem' : 'problems'}${key}`
    }
    case 'difficulty': {
      const solved = Object.keys(progress).filter((id) => progress[id].status === 'solved').map((id) => PROBLEMS.get(id)!.problem.difficulty)
      if (!solved.length) return 'Solve 3 Medium problems this week'
      const hard = solved.filter((d) => d === 'Hard').length
      const needHard = Math.ceil(HARD_TARGET * ROLE_MULTIPLIER[target.role] * solved.length) - hard
      if (needHard > 0) return `Solve ${needHard} more Hard ${needHard === 1 ? 'problem' : 'problems'}`
      const mh = solved.filter((d) => d !== 'Easy').length
      return `Solve ${Math.max(1, Math.ceil(MEDIUM_PLUS_HARD_TARGET * solved.length) - mh)} more Medium problems`
    }
    case 'retention': {
      const recent = input.reviewLog.filter((r) => r.at > now - 30 * DAY_MS)
      if (!recent.length) return 'Pass 3 reviews this week'
      const n = Math.max(1, Math.ceil(0.8 * recent.length) - recent.filter((r) => r.passed).length)
      return `Pass ${n} more ${n === 1 ? 'review' : 'reviews'} this week`
    }
    case 'tests':
      return input.tests.length ? 'Score 7 or more on your next test' : 'Take a test'
    case 'consistency': {
      let active = 0
      for (let i = 0; i < 14; i++) if ((input.days[localDateKey(new Date(now - i * DAY_MS))]?.completedIds.length ?? 0) > 0) active++
      const n = Math.max(1, Math.min(7, 14 - active))
      return `Practise on ${n} more ${n === 1 ? 'day' : 'days'} in the next two weeks`
    }
    case 'external':
      return input.leetcode ? `Solve ${EXTERNAL_CAP - Math.min(EXTERNAL_CAP, input.leetcode.solved.total)} more on LeetCode (up to 400 count)` : 'Connect LeetCode in Settings'
  }
}
