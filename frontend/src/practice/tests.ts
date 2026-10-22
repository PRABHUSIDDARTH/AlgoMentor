import { PROBLEMS, type Difficulty } from '@/content/roadmap'
import { loadProgress, recordReviewFailed, scheduleReview, type Progress } from './progress'
import { DAY_MS, startOfLocalDay } from './schedule'

export type TestResult = 'solved' | 'hinted' | 'skipped'
export type PracticeTest = {
  id: string
  seed: number
  createdAt: number
  durationMin: 60
  /** `assisted`: a hint or the solution was seen for this problem during the test. */
  problems: { problemId: string; kind: 'revision' | 'new'; result?: TestResult; assisted?: boolean }[]
  finishedAt?: number
}

export const TESTS_KEY = 'algomentor.tests.v1'
export const TEST_SIZE = 10
const REVISION = 3
const PER_STAGE = 3
const MIN_STAGES = Math.ceil(TEST_SIZE / PER_STAGE) // 4

/** Small, fast, seedable PRNG so a test can be regenerated exactly from its seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function difficultyMix(level: number): Record<Difficulty, number> {
  if (level <= 3) return { Easy: 6, Medium: 4, Hard: 0 }
  if (level <= 6) return { Easy: 3, Medium: 6, Hard: 1 }
  return { Easy: 1, Medium: 6, Hard: 3 }
}

const ORDER: Difficulty[] = ['Easy', 'Medium', 'Hard']

/**
 * 10 problems: 3 revision (solved before, lowest review step first) and 7 new (unsolved, from
 * open stages), the other pool filling a short one; difficulty mix by level, at most 3 per stage.
 */
export function generateTest(level: number, progress: Progress, unlockedStageIds: string[], seed: number): PracticeTest | { error: string } {
  const rng = mulberry32(seed)
  const all = [...PROBLEMS.values()]
  const revPool = shuffle(all.filter((e) => progress[e.problem.id]?.status === 'solved'), rng)
    .sort((a, b) => progress[a.problem.id].reviewStep - progress[b.problem.id].reviewStep)
  const newPool = shuffle(all.filter((e) => unlockedStageIds.includes(e.stageId) && progress[e.problem.id]?.status !== 'solved'), rng)
  const stages = new Set([...revPool, ...newPool].map((e) => e.stageId))
  if (revPool.length + newPool.length < TEST_SIZE || stages.size < MIN_STAGES) {
    return { error: `A test needs at least ${TEST_SIZE} problems across at least ${MIN_STAGES} stages. Solve a few more or unlock more stages on the roadmap first.` }
  }

  let revTarget = Math.min(REVISION, revPool.length)
  let newTarget = TEST_SIZE - revTarget
  if (newPool.length < newTarget) {
    newTarget = newPool.length
    revTarget = Math.min(revPool.length, TEST_SIZE - newTarget)
  }

  const quota = difficultyMix(level)
  const perStage = new Map<string, number>()
  const picked: PracticeTest['problems'] = []
  const used = new Set<string>()
  const canTake = (e: (typeof all)[number]) => !used.has(e.problem.id) && (perStage.get(e.stageId) ?? 0) < PER_STAGE
  const take = (e: (typeof all)[number], kind: 'revision' | 'new') => {
    used.add(e.problem.id)
    perStage.set(e.stageId, (perStage.get(e.stageId) ?? 0) + 1)
    picked.push({ problemId: e.problem.id, kind })
    const d = e.problem.difficulty
    // Charge the quota of this difficulty, or the nearest one that still has room.
    const charge = quota[d] > 0 ? d : [...ORDER].sort((x, y) => Math.abs(ORDER.indexOf(x) - ORDER.indexOf(d)) - Math.abs(ORDER.indexOf(y) - ORDER.indexOf(d))).find((x) => quota[x] > 0)
    if (charge) quota[charge]--
  }
  const fill = (pool: typeof all, kind: 'revision' | 'new', n: number) => {
    let count = 0
    for (const e of pool) {
      if (count === n) return count
      if (canTake(e) && quota[e.problem.difficulty] > 0) { take(e, kind); count++ }
    }
    // Not enough of the wanted difficulties: take the nearest available ones.
    while (count < n) {
      const wanted = ORDER.filter((d) => quota[d] > 0)
      const distance = (d: Difficulty) => (wanted.length ? Math.min(...wanted.map((w) => Math.abs(ORDER.indexOf(w) - ORDER.indexOf(d)))) : 0)
      const best = pool.filter(canTake).sort((a, b) => distance(a.problem.difficulty) - distance(b.problem.difficulty))[0]
      if (!best) break
      take(best, kind)
      count++
    }
    return count
  }
  const gotRev = fill(revPool, 'revision', revTarget)
  const gotNew = fill(newPool, 'new', newTarget + (revTarget - gotRev))
  if (gotRev + gotNew < TEST_SIZE) fill(revPool, 'revision', TEST_SIZE - gotRev - gotNew)
  if (picked.length < TEST_SIZE) {
    return { error: `A test needs at least ${TEST_SIZE} problems across at least ${MIN_STAGES} stages. Solve a few more or unlock more stages on the roadmap first.` }
  }

  return { id: `t${seed.toString(36)}`, seed, createdAt: Date.now(), durationMin: 60, problems: shuffle(picked, rng) }
}

export function scoreTest(t: PracticeTest): { score: number; max: number; byStage: Record<string, { got: number; of: number }>; weakStageIds: string[] } {
  const byStage: Record<string, { got: number; of: number }> = {}
  let score = 0
  for (const p of t.problems) {
    const points = p.result === 'solved' ? 1 : p.result === 'hinted' ? 0.5 : 0
    score += points
    const stage = PROBLEMS.get(p.problemId)?.stageId ?? 'unknown'
    byStage[stage] = { got: (byStage[stage]?.got ?? 0) + points, of: (byStage[stage]?.of ?? 0) + 1 }
  }
  const weakStageIds = Object.entries(byStage).filter(([, v]) => v.got / v.of < 0.5).map(([k]) => k)
  return { score, max: t.problems.length, byStage, weakStageIds }
}

/** Ends a test: missed revision problems restart their reviews, and each weak stage gets an extra review within 3 days. */
export function finishTest(t: PracticeTest, now = Date.now()): PracticeTest {
  for (const p of t.problems) {
    if (p.kind === 'revision' && p.result !== 'solved') recordReviewFailed(p.problemId, now)
  }
  const progress = loadProgress()
  scoreTest(t).weakStageIds.forEach((stageId, i) => {
    const solved = [...PROBLEMS.values()].filter((e) => e.stageId === stageId && progress[e.problem.id]?.status === 'solved')
    const target = solved.sort((a, b) => (progress[b.problem.id].nextReviewAt ?? Infinity) - (progress[a.problem.id].nextReviewAt ?? Infinity))[0]
    if (target) scheduleReview(target.problem.id, startOfLocalDay(now) + (1 + (i % 3)) * DAY_MS)
  })
  const done = { ...t, finishedAt: now }
  saveTest(done)
  return done
}

function validTest(t: unknown): t is PracticeTest {
  const v = t as PracticeTest
  return !!v && typeof v.id === 'string' && typeof v.seed === 'number' && typeof v.createdAt === 'number' && Array.isArray(v.problems)
    && v.problems.every((p) => p && PROBLEMS.has(p.problemId) && (p.kind === 'revision' || p.kind === 'new')
      && (p.result === undefined || ['solved', 'hinted', 'skipped'].includes(p.result))
      && (p.assisted === undefined || typeof p.assisted === 'boolean'))
}

export function loadTests(): Record<string, PracticeTest> {
  try {
    const raw = JSON.parse(localStorage.getItem(TESTS_KEY) ?? '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    return Object.fromEntries(Object.entries(raw).filter(([, t]) => validTest(t))) as Record<string, PracticeTest>
  } catch {
    return {}
  }
}

export function saveTest(t: PracticeTest): void {
  try {
    localStorage.setItem(TESTS_KEY, JSON.stringify({ ...loadTests(), [t.id]: t }))
  } catch {
    // Storage full or blocked.
  }
}
