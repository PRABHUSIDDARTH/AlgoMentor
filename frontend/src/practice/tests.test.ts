import { afterEach, describe, expect, it } from 'vitest'
import { PROBLEMS, STAGES } from '@/content/roadmap'
import { loadProgress, markStageKnown, recordSolve, type Progress } from './progress'
import { DAY_MS, startOfLocalDay } from './schedule'
import { finishTest, generateTest, loadTests, mulberry32, saveTest, scoreTest, type PracticeTest } from './tests'

const NOON = new Date(2026, 9, 22, 12, 0).getTime()
const ALL = STAGES.map((s) => s.id)
const stageOf = (id: string) => PROBLEMS.get(id)!.stageId
const difficulty = (id: string) => PROBLEMS.get(id)!.problem.difficulty
const ok = (t: ReturnType<typeof generateTest>) => {
  if ('error' in t) throw new Error(t.error)
  return t
}

afterEach(() => localStorage.clear())

describe('mulberry32', () => {
  it('isDeterministic', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})

describe('generateTest', () => {
  it('mixIs3RevisionAnd7New', () => {
    markStageKnown('basics', NOON)
    const t = ok(generateTest(1, loadProgress(), ['basics', 'arrays', 'hashing', 'strings'], 7))
    expect(t.problems).toHaveLength(10)
    expect(t.problems.filter((p) => p.kind === 'revision')).toHaveLength(3)
    expect(t.problems.filter((p) => p.kind === 'new')).toHaveLength(7)
    expect(t.durationMin).toBe(60)
  })

  it('fillsFromOtherPoolWhenShort', () => {
    const t = ok(generateTest(1, {}, ['basics', 'arrays', 'hashing', 'strings'], 7))
    expect(t.problems.every((p) => p.kind === 'new')).toBe(true)
    expect(t.problems).toHaveLength(10)
  })

  it('explainsWhenTooFewProblems', () => {
    // A brand-new user: nothing solved, only stage 1 open (14 problems, but one stage can give only 3).
    for (const open of [['basics'], ['basics', 'arrays', 'hashing']]) {
      const result = generateTest(1, {}, open, 7)
      expect(result).toHaveProperty('error')
      expect((result as { error: string }).error).toMatch(/at least 10 problems across at least 4 stages/)
    }
  })

  it('maxThreePerStage', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const t = ok(generateTest(5, {}, ALL, seed))
      const counts = new Map<string, number>()
      t.problems.forEach((p) => counts.set(stageOf(p.problemId), (counts.get(stageOf(p.problemId)) ?? 0) + 1))
      expect(Math.max(...counts.values())).toBeLessThanOrEqual(3)
      expect(new Set(t.problems.map((p) => p.problemId)).size).toBe(10)
    }
  })

  it.each([
    [2, { Easy: 6, Medium: 4, Hard: 0 }],
    [5, { Easy: 3, Medium: 6, Hard: 1 }],
    [8, { Easy: 1, Medium: 6, Hard: 3 }],
  ] as const)('difficultyMixFollowsLevel L%i', (level, mix) => {
    const t = ok(generateTest(level, {}, ALL, 11))
    const got = { Easy: 0, Medium: 0, Hard: 0 }
    t.problems.forEach((p) => got[difficulty(p.problemId)]++)
    expect(got).toEqual(mix)
  })

  it('fallsBackToNearestDifficultyWhenShort', () => {
    // Stage 1 has no Hard problems; with basics + arrays open, a level-8 test still fills 10.
    const t = ok(generateTest(8, {}, ['basics', 'arrays', 'hashing', 'strings'], 3))
    expect(t.problems).toHaveLength(10)
  })

  it('sameSeedSameTest', () => {
    const a = ok(generateTest(5, {}, ALL, 99))
    const b = ok(generateTest(5, {}, ALL, 99))
    expect(b.problems).toEqual(a.problems)
    expect(ok(generateTest(5, {}, ALL, 100)).problems).not.toEqual(a.problems)
  })
})

describe('scoring and finishing', () => {
  const test = (results: PracticeTest['problems'][number]['result'][]): PracticeTest => {
    const t = ok(generateTest(5, {}, ALL, 5))
    return { ...t, problems: t.problems.map((p, i) => ({ ...p, result: results[i] })) }
  }

  it('scoreCountsHintsAsHalf', () => {
    const s = scoreTest(test(['solved', 'hinted', 'skipped', 'solved']))
    expect(s.score).toBe(2.5)
    expect(s.max).toBe(10)
  })

  it('weakStagesAreBelowHalf', () => {
    const t = test(Array(10).fill('skipped'))
    const s = scoreTest(t)
    expect(s.weakStageIds.sort()).toEqual([...new Set(t.problems.map((p) => stageOf(p.problemId)))].sort())
  })

  it('finishResetsMissedRevisionsAndSchedulesWeakStages', () => {
    markStageKnown('basics', NOON)
    const t0 = ok(generateTest(1, loadProgress(), ['basics', 'arrays', 'hashing', 'strings'], 7))
    const t = { ...t0, problems: t0.problems.map((p) => ({ ...p, result: 'skipped' as const })) }
    const done = finishTest(t, NOON)
    expect(done.finishedAt).toBe(NOON)
    const progress: Progress = loadProgress()
    for (const p of t.problems.filter((x) => x.kind === 'revision')) {
      expect(progress[p.problemId]).toMatchObject({ reviewStep: 0 })
      expect(progress[p.problemId].nextReviewAt).toBe(startOfLocalDay(NOON) + DAY_MS)
    }
    expect(loadTests()[t.id].finishedAt).toBe(NOON)
  })

  it('persistsTests', () => {
    const t = ok(generateTest(5, {}, ALL, 5))
    saveTest(t)
    expect(loadTests()[t.id]).toEqual(t)
    recordSolve('two-sum', { hintsUsed: 0 })
  })
})
