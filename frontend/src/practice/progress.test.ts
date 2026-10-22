import { afterEach, describe, expect, it, vi } from 'vitest'
import { STAGES } from '@/content/roadmap'
import { DAY_MS, nextReviewAt } from './schedule'
import {
  isUnlocked, loadProgress, loadUnlocks, markStageKnown, PROGRESS_EVENT, PROGRESS_KEY, recordSolve, stageCompletion,
  syncFromLeetCode, unlockStage,
} from './progress'

const NOON = new Date(2026, 9, 22, 12, 0).getTime()
const first = STAGES[0]
const second = STAGES[1]
const ids = (stage = first) => stage.patterns.flatMap((p) => p.problems.map((q) => q.id))

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('progress', () => {
  it('firstSolveDueTomorrow', () => {
    recordSolve('two-sum', { hintsUsed: 0, now: NOON })
    expect(loadProgress()['two-sum']).toMatchObject({ status: 'solved', firstSolvedAt: NOON, reviewStep: 0, nextReviewAt: nextReviewAt(0, NOON) })
  })

  it('passedReviewAdvancesAStep', () => {
    recordSolve('two-sum', { hintsUsed: 0, now: NOON })
    recordSolve('two-sum', { hintsUsed: 0, now: NOON + DAY_MS })
    expect(loadProgress()['two-sum']).toMatchObject({ reviewStep: 1, nextReviewAt: nextReviewAt(1, NOON + DAY_MS) })
  })

  it('hintsResetToStep0', () => {
    recordSolve('two-sum', { hintsUsed: 0, now: NOON })
    recordSolve('two-sum', { hintsUsed: 0, now: NOON + DAY_MS })
    recordSolve('two-sum', { hintsUsed: 2, now: NOON + 4 * DAY_MS })
    expect(loadProgress()['two-sum']).toMatchObject({ reviewStep: 0, nextReviewAt: nextReviewAt(0, NOON + 4 * DAY_MS) })
  })

  it('reSolvingBeforeItIsDueDoesNotAdvance', () => {
    recordSolve('two-sum', { hintsUsed: 0, now: NOON })
    recordSolve('two-sum', { hintsUsed: 0, now: NOON + 1000 })
    expect(loadProgress()['two-sum'].reviewStep).toBe(0)
  })

  it('ignoresUnknownProblemIds', () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      'gone-id': { status: 'solved', reviewStep: 0, nextReviewAt: 1 },
      'two-sum': { status: 'solved', reviewStep: 9, nextReviewAt: 'soon' },
    }))
    expect(loadProgress()).toEqual({})
    const c = stageCompletion(first.id, loadProgress())
    expect(Number.isNaN(c.ratio)).toBe(false)
    expect(c.solved).toBe(0)
  })

  it('stage1AlwaysUnlocked', () => {
    expect(isUnlocked(first.id, {}, [])).toBe(true)
    expect(isUnlocked(second.id, {}, [])).toBe(false)
  })

  it('unlocksAt70Percent', () => {
    const all = ids()
    const need = Math.ceil(all.length * 0.7)
    all.slice(0, need - 1).forEach((id) => recordSolve(id, { hintsUsed: 0, now: NOON }))
    expect(isUnlocked(second.id, loadProgress(), [])).toBe(false)
    recordSolve(all[need - 1], { hintsUsed: 0, now: NOON })
    expect(isUnlocked(second.id, loadProgress(), [])).toBe(true)
  })

  it('manualUnlockRecorded', () => {
    unlockStage('graphs')
    expect(loadUnlocks()).toEqual(['graphs'])
    expect(isUnlocked('graphs', {}, loadUnlocks())).toBe(true)
  })

  it('markStageKnownHasNoReviews', () => {
    markStageKnown(first.id, NOON)
    const p = loadProgress()
    for (const id of ids()) expect(p[id]).toMatchObject({ status: 'solved', known: true, nextReviewAt: null })
    expect(stageCompletion(first.id, p).ratio).toBe(1)
  })

  it('syncFromLeetCodeMarksMatchingSlugs', () => {
    const count = syncFromLeetCode([
      { slug: 'two-sum', title: 'Two Sum', solvedAt: 1_790_000_000 },
      { slug: 'not-in-roadmap-xyz', title: 'Nope', solvedAt: 1_790_000_000 },
    ])
    expect(count).toBe(1)
    expect(loadProgress()['two-sum']).toMatchObject({ status: 'solved', firstSolvedAt: 1_790_000_000_000 })
    expect(syncFromLeetCode([{ slug: 'two-sum', title: 'Two Sum', solvedAt: 1_790_000_000 }])).toBe(0)
  })

  it('emitsProgressEvent', () => {
    const listener = vi.fn()
    window.addEventListener(PROGRESS_EVENT, listener)
    recordSolve('two-sum', { hintsUsed: 0, now: NOON })
    window.removeEventListener(PROGRESS_EVENT, listener)
    expect(listener).toHaveBeenCalledOnce()
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ ids: ['two-sum'] })
  })
})
