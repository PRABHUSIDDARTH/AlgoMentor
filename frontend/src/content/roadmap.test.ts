import { describe, expect, it } from 'vitest'
import leetcode from './roadmap-leetcode.json'
import { PROBLEMS, STAGES } from './roadmap'
import source from './roadmap.source.json'
import { TARGET_WEIGHTS } from './targets'

const RANK = { Easy: 0, Medium: 1, Hard: 2 } as const

describe('roadmap content', () => {
  it('has18OrderedStages', () => {
    expect(STAGES).toHaveLength(18)
    expect(STAGES.map((s) => s.order)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1))
  })

  it('uniqueIds', () => {
    const stageIds = STAGES.map((s) => s.id)
    const patternIds = STAGES.flatMap((s) => s.patterns.map((p) => p.id))
    const problemIds = STAGES.flatMap((s) => s.patterns.flatMap((p) => p.problems.map((q) => q.id)))
    expect(new Set(stageIds).size).toBe(stageIds.length)
    expect(new Set(patternIds).size).toBe(patternIds.length)
    expect(new Set(problemIds).size).toBe(problemIds.length)
    expect(PROBLEMS.size).toBe(problemIds.length)
  })

  it('patternSizes', () => {
    for (const s of STAGES) {
      expect(s.patterns.length, s.id).toBeGreaterThanOrEqual(3)
      expect(s.patterns.length, s.id).toBeLessThanOrEqual(8)
      for (const p of s.patterns) {
        expect(p.problems.length, p.id).toBeGreaterThanOrEqual(3)
        expect(p.problems.length, p.id).toBeLessThanOrEqual(6)
      }
    }
  })

  it('totalAbout300', () => {
    expect(PROBLEMS.size).toBeGreaterThanOrEqual(270)
    expect(PROBLEMS.size).toBeLessThanOrEqual(330)
  })

  it('easyBeforeHardWithinPattern', () => {
    for (const p of STAGES.flatMap((s) => s.patterns)) {
      const ranks = p.problems.map((q) => RANK[q.difficulty])
      expect(ranks, p.id).toEqual([...ranks].sort((a, b) => a - b))
    }
  })

  it('leetcodeProblemsHaveSlugAndUrl', () => {
    for (const { problem } of PROBLEMS.values()) {
      expect(problem.source).toBe('leetcode')
      expect(problem.url).toBe(`https://leetcode.com/problems/${problem.slug}/`)
    }
  })

  it('everyPatternHasOriginalIdea', () => {
    for (const s of STAGES) {
      expect(s.summary.length, s.id).toBeGreaterThan(20)
      expect(s.concepts.length, s.id).toBeGreaterThanOrEqual(2)
      for (const p of s.patterns) {
        expect(p.idea.length, p.id).toBeGreaterThanOrEqual(10)
        expect(p.idea.length, p.id).toBeLessThanOrEqual(220)
        expect(p.idea).not.toBe(p.title)
      }
    }
  })

  it('weightsCoverEveryStage', () => {
    for (const company of ['maang', 'product', 'startup', 'service'] as const) {
      for (const s of STAGES) expect([0, 1, 2, 3], `${company} ${s.id}`).toContain(TARGET_WEIGHTS[company][s.id])
    }
  })

  it('validationFileCoversEverySlugAndAllResolved', () => {
    const slugs = source.stages.flatMap((s) => s.patterns.flatMap((p) => p.slugs))
    for (const slug of slugs) {
      const meta = (leetcode.problems as Record<string, { ok: boolean; paidOnly: boolean }>)[slug]
      expect(meta?.ok, slug).toBe(true)
      expect(meta?.paidOnly, `${slug} is Premium`).toBe(false)
    }
  })
})
