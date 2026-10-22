import { describe, expect, it } from 'vitest'
import { PROBLEMS, STAGES } from '@/content/roadmap'
import type { LeetCodeProfile } from '@/lib/api'
import { levelFor, levelScore, readiness, topGaps, type LevelInput } from './level'
import type { Progress } from './progress'
import { DAY_MS } from './schedule'

const NOW = new Date(2026, 9, 22, 12).getTime()
const FAANG = { company: 'faang' as const, role: 'sde1' as const }
const solvedAll = (filter: (id: string) => boolean): Progress =>
  Object.fromEntries([...PROBLEMS.keys()].filter(filter).map((id) => [id, { status: 'solved' as const, reviewStep: 1, nextReviewAt: null }]))
const input = (over: Partial<LevelInput> = {}): LevelInput => ({ progress: {}, unlocks: [], target: FAANG, tests: [], days: {}, reviewLog: [], leetcode: undefined, now: NOW, ...over })
const lc = (total: number): LeetCodeProfile => ({ username: 'x', ranking: 1, solved: { easy: 0, medium: 0, hard: 0, total }, topics: [], recent: [] })

describe('level', () => {
  it.each([[0, 1], [7, 1], [8, 2], [14, 2], [15, 3], [23, 3], [24, 4], [44, 6], [86, 9], [87, 10], [100, 10]])('levelThresholds %i -> L%i', (score, level) => {
    expect(levelFor(score)).toBe(level)
  })

  it('emptyInputScoresZero', () => {
    expect(levelScore(input()).total).toBe(0)
  })

  it('coverageUsesTargetWeights', () => {
    const graphs = STAGES.find((s) => s.id === 'graphs')!
    const graphIds = new Set(graphs.patterns.flatMap((p) => p.problems.map((q) => q.id)))
    const faang = levelScore(input({ progress: solvedAll((id) => graphIds.has(id)) })).parts.coverage
    const service = levelScore(input({ progress: solvedAll((id) => graphIds.has(id)), target: { company: 'service', role: 'sde1' } })).parts.coverage
    expect(faang).toBeGreaterThan(service) // graphs weigh 3 for FAANG, 1 for service
    expect(levelScore(input({ progress: solvedAll(() => true) })).parts.coverage).toBeCloseTo(35)
  })

  it('difficultyExpectationScalesWithRole', () => {
    const hardIds = [...PROBLEMS.values()].filter((e) => e.problem.difficulty === 'Hard').slice(0, 2).map((e) => e.problem.id)
    const mediumIds = [...PROBLEMS.values()].filter((e) => e.problem.difficulty === 'Medium').slice(0, 18).map((e) => e.problem.id)
    const progress = solvedAll((id) => hardIds.includes(id) || mediumIds.includes(id)) // 2 of 20 hard = 10%
    const intern = levelScore(input({ progress, target: { company: 'faang', role: 'intern' } })).parts.difficulty
    const sde2 = levelScore(input({ progress, target: { company: 'faang', role: 'sde2' } })).parts.difficulty
    expect(intern).toBeCloseTo(20)
    expect(sde2).toBeLessThan(intern)
  })

  it('externalCapsAt400', () => {
    expect(levelScore(input({ leetcode: lc(200) })).parts.external).toBeCloseTo(2.5)
    expect(levelScore(input({ leetcode: lc(1500) })).parts.external).toBeCloseTo(5)
  })

  it('retentionTestsAndConsistency', () => {
    const parts = levelScore(input({
      reviewLog: [{ id: 'a', at: NOW - DAY_MS, passed: true }, { id: 'b', at: NOW - 2 * DAY_MS, passed: false }, { id: 'c', at: NOW - 40 * DAY_MS, passed: false }],
      tests: [8, 6, 10, 0].map((s, i) => ({ score: s, finishedAt: NOW - i * DAY_MS })),
      days: Object.fromEntries(Array.from({ length: 7 }, (_, i) => {
        const d = new Date(NOW - i * DAY_MS)
        return [`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, { items: [], completedIds: ['x'] }]
      })),
    })).parts
    expect(parts.retention).toBeCloseTo(7.5) // 1 of 2 in the last 30 days
    expect(parts.tests).toBeCloseTo(12) // mean of last 3 = 8/10
    expect(parts.consistency).toBeCloseTo(5) // 7 of 14 days
  })

  it('readinessUsesBar', () => {
    expect(readiness(60, FAANG)).toBe(75)
    expect(readiness(60, { company: 'service', role: 'intern' })).toBe(100)
  })

  it('readinessCapsAt100', () => {
    expect(readiness(99, { company: 'startup', role: 'sde1' })).toBe(100)
  })

  it('topGapsPickLargestWeightedShortfalls', () => {
    const gaps = topGaps(input({ leetcode: lc(400), tests: [{ score: 10, finishedAt: NOW }] }))
    expect(gaps).toHaveLength(3)
    expect(gaps.map((g) => g.component)).toEqual(['coverage', 'difficulty', 'retention'])
  })

  it('coverageGapPointsAtAnOpenStage', () => {
    // A new learner only has stage 1 open: don't send them to a locked key stage.
    expect(topGaps(input())[0].action).toBe('Complexity & maths basics: solve 10 more problems')
    // With Graphs unlocked by hand, the FAANG key stage wins.
    expect(topGaps(input({ unlocks: ['graphs'] }))[0].action).toMatch(/^Graphs: solve \d+ more problems \(key for FAANG \/ product\)$/)
  })

  it('gapCopyIsConcrete', () => {
    const gaps = topGaps(input())
    const text = gaps.map((g) => g.action).join(' | ')
    expect(text).toMatch(/: solve \d+ more problems?/)
    for (const g of topGaps(input({ progress: solvedAll((id) => PROBLEMS.get(id)!.stageId === 'basics') }))) expect(g.action).toMatch(/\d|Take a test|Connect LeetCode/)
    const external = topGaps(input({ progress: solvedAll(() => true), reviewLog: [{ id: 'a', at: NOW, passed: true }], tests: [{ score: 10, finishedAt: NOW }] }))
    expect(external.some((g) => g.action === 'Connect LeetCode in Settings')).toBe(true)
  })
})
