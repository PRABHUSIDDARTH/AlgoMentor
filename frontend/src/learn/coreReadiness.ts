import { TRACKS } from '@/content/learn'
import { GIT_CHALLENGES } from '@/content/learn/git-challenges'
import { PROJECTS } from '@/content/learn/projects'
import { CHALLENGE_IDS, type TrackId } from '@/content/learn/types'
import { CORE_BAR } from '@/content/targets'
import type { Target } from '@/practice/store'
import type { LearnProgress } from './progress'
import { checkKey, passedChallenges, type GitState } from './repos'

/** Core CS readiness weights (Learning hub spec §7). Each part below is already scaled to its weight. */
export const CORE_WEIGHTS = { modules: 40, quiz: 30, projects: 20, git: 10 } as const
export type CoreComponent = keyof typeof CORE_WEIGHTS
export type CoreParts = Record<CoreComponent, number>

export type CoreInput = { learn: LearnProgress; git: GitState; target: Target }

/** Service companies lean on networks and databases, so those modules count one and a half times. */
const SERVICE_WEIGHT: Partial<Record<TrackId, number>> = { cn: 1.5, dbms: 1.5 }
const trackWeight = (id: TrackId, target: Target) => (target.company === 'service' ? (SERVICE_WEIGHT[id] ?? 1) : 1)

const isDone = (learn: LearnProgress, moduleId: string) => learn[moduleId]?.completedAt !== undefined
const projectVerified = (git: GitState, p: (typeof PROJECTS)[number]) => p.gitMilestones.every((m) => git.checks[checkKey(p.id, m)]?.passedAt !== undefined)

function fractions({ learn, git, target }: CoreInput): CoreParts {
  let have = 0
  let want = 0
  for (const t of TRACKS) {
    const w = trackWeight(t.id, target)
    have += w * t.modules.filter((m) => isDone(learn, m.id)).length
    want += w * t.modules.length
  }
  const all = TRACKS.flatMap((t) => t.modules)
  const quiz = all.reduce((n, m) => n + (learn[m.id]?.bestQuiz ?? 0), 0) / (5 * all.length)
  return {
    modules: want ? have / want : 0,
    quiz,
    projects: PROJECTS.filter((p) => projectVerified(git, p)).length / PROJECTS.length,
    git: passedChallenges(git).size / CHALLENGE_IDS.length,
  }
}

export function coreScore(input: CoreInput): { total: number; parts: CoreParts } {
  const f = fractions(input)
  const parts = Object.fromEntries((Object.keys(CORE_WEIGHTS) as CoreComponent[]).map((k) => [k, f[k] * CORE_WEIGHTS[k]])) as CoreParts
  return { total: Object.values(parts).reduce((a, b) => a + b, 0), parts }
}

/** Score as a percentage of the target's Core CS bar, capped at 100. */
export function coreReadiness(total: number, target: Target): number {
  return Math.min(100, Math.round((total / CORE_BAR[target.company]) * 100))
}

/** Up to 3 concrete next steps, for the parts with the largest weighted shortfall. */
export function coreGaps(input: CoreInput): { component: CoreComponent; action: string }[] {
  const { parts } = coreScore(input)
  return (Object.keys(CORE_WEIGHTS) as CoreComponent[])
    .map((k) => ({ k, gap: CORE_WEIGHTS[k] - parts[k] }))
    .filter((x) => x.gap > 0.01)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .map(({ k }) => ({ component: k, action: action(k, input) }))
}

/** The track with the most weighted work left; the earliest one wins a tie. */
function busiestTrack({ learn, target }: CoreInput) {
  let best: (typeof TRACKS)[number] | undefined
  let bestLeft = 0
  for (const t of TRACKS) {
    const left = t.modules.filter((m) => !isDone(learn, m.id)).length * trackWeight(t.id, target)
    if (left > bestLeft) {
      best = t
      bestLeft = left
    }
  }
  return best
}

function action(k: CoreComponent, input: CoreInput): string {
  const { learn, git } = input
  switch (k) {
    case 'modules': {
      const t = busiestTrack(input)!
      const left = t.modules.filter((m) => !isDone(learn, m.id)).length
      const n = Math.min(3, left)
      return `${t.short}: finish ${n} more ${n === 1 ? 'module' : 'modules'}`
    }
    case 'quiz': {
      const all = TRACKS.flatMap((t) => t.modules)
      const retake = all.filter((m) => (learn[m.id]?.bestQuiz ?? 0) > 0 && learn[m.id].bestQuiz < 5).sort((a, b) => learn[a.id].bestQuiz - learn[b.id].bestQuiz)[0]
      if (retake) return `Retake the quiz for "${retake.title}" (best ${learn[retake.id].bestQuiz} of 5)`
      const track = busiestTrack(input)
      const fresh = (track?.modules ?? all).find((m) => !learn[m.id]?.bestQuiz) ?? all.find((m) => !learn[m.id]?.bestQuiz)!
      return `Take the quiz for "${fresh.title}"`
    }
    case 'projects': {
      const open = PROJECTS.filter((p) => !projectVerified(git, p))
      const passes = (p: (typeof PROJECTS)[number]) => p.gitMilestones.filter((m) => git.checks[checkKey(p.id, m)]?.passedAt !== undefined).length
      const pick = [...open].sort((a, b) => passes(b) - passes(a))[0]
      return `Verify the ${pick.title} project`
    }
    case 'git': {
      const passed = passedChallenges(git)
      const next = GIT_CHALLENGES.find((c) => !passed.has(c.id))!
      return `Pass the "${next.title}" challenge`
    }
  }
}
