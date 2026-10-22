/**
 * AlgoMentor's own 18-stage DSA roadmap. Structure, ideas and problem choice live in
 * roadmap.source.json; titles and difficulties come from roadmap-leetcode.json, which
 * scripts/validate-roadmap.mjs fetches from LeetCode, so they can't drift from the real problems.
 */
import leetcode from './roadmap-leetcode.json'
import source from './roadmap.source.json'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type RoadmapProblem = { id: string; title: string; difficulty: Difficulty; source: 'leetcode'; slug: string; url: string }
export type SeeAlso = { striver?: string; risingbrain?: string; gfg?: string }
export type Pattern = { id: string; title: string; idea: string; problems: RoadmapProblem[]; seeAlso: SeeAlso }
export type Stage = { id: string; order: number; title: string; summary: string; concepts: string[]; patterns: Pattern[]; leetcodeTags: string[] }

type Meta = { ok: boolean; title: string | null; difficulty: Difficulty | null; paidOnly: boolean }
const META = leetcode.problems as Record<string, Meta>
const RANK: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 }

function problem(slug: string): RoadmapProblem {
  const meta = META[slug]
  return {
    id: slug,
    slug,
    title: meta?.title ?? slug,
    difficulty: meta?.difficulty ?? 'Medium',
    source: 'leetcode',
    url: `https://leetcode.com/problems/${slug}/`,
  }
}

export const STAGES: Stage[] = source.stages.map((s) => ({
  id: s.id,
  order: s.order,
  title: s.title,
  summary: s.summary,
  concepts: s.concepts,
  leetcodeTags: s.leetcodeTags,
  patterns: s.patterns.map((p) => ({
    id: p.id,
    title: p.title,
    idea: p.idea,
    seeAlso: p.seeAlso as SeeAlso,
    // Easy → Medium → Hard, keeping the authored order within a difficulty.
    problems: p.slugs.map(problem).map((q, i) => ({ q, i })).sort((a, b) => RANK[a.q.difficulty] - RANK[b.q.difficulty] || a.i - b.i).map(({ q }) => q),
  })),
}))

export const STAGE_BY_ID = new Map(STAGES.map((s) => [s.id, s]))

export const PROBLEMS = new Map<string, { problem: RoadmapProblem; stageId: string; patternId: string }>(
  STAGES.flatMap((s) => s.patterns.flatMap((p) => p.problems.map((q) => [q.id, { problem: q, stageId: s.id, patternId: p.id }] as const))),
)

/** Public pages of the sheets each pattern cross-references (labels only; we never copy their lists). */
export const SHEET_LINKS = {
  striver: { name: 'Striver A2Z', url: 'https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet' },
  risingbrain: { name: 'RisingBrain', url: 'https://risingbrain.org/sheet' },
  gfg: { name: 'GfG DSA', url: 'https://www.geeksforgeeks.org/dsa/dsa-tutorial-learn-data-structures-and-algorithms/' },
} as const
