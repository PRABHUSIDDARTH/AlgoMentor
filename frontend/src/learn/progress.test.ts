import { afterEach, describe, expect, it, vi } from 'vitest'
import { TRACKS } from '@/content/learn'
import { DAY_MS, nextReviewAt } from '@/practice/schedule'
import { dueModules, LEARN_EVENT, LEARN_KEY, loadLearn, markModuleComplete, recordQuiz, recordReview } from './progress'

const id = TRACKS[0].modules[0].id
const NOW = new Date(2026, 9, 22, 10).getTime()

afterEach(() => localStorage.clear())

describe('module progress', () => {
  it('completeNeedsFourOfFive', () => {
    recordQuiz(id, 3)
    expect(markModuleComplete(id, NOW)).toBe(false)
    expect(loadLearn()[id].completedAt).toBeUndefined()
    recordQuiz(id, 4)
    recordQuiz(id, 2)
    expect(loadLearn()[id].bestQuiz).toBe(4)
    expect(markModuleComplete(id, NOW)).toBe(true)
    expect(loadLearn()[id].completedAt).toBe(NOW)
  })

  it('completedModuleSchedulesReview', () => {
    recordQuiz(id, 5)
    markModuleComplete(id, NOW)
    expect(loadLearn()[id].nextReviewAt).toBe(nextReviewAt(0, NOW))
    expect(dueModules(NOW)).toEqual([])
    expect(dueModules(NOW + 2 * DAY_MS)).toEqual([id])
    recordReview(id, true, NOW + 2 * DAY_MS)
    expect(loadLearn()[id].reviewStep).toBe(1)
    expect(dueModules(NOW + 2 * DAY_MS)).toEqual([])
    recordReview(id, false, NOW + 9 * DAY_MS)
    expect(loadLearn()[id].reviewStep).toBe(0)
  })

  it('ignoresUnknownModules', () => {
    localStorage.setItem(LEARN_KEY, JSON.stringify({
      [id]: { bestQuiz: 4, reviewStep: 0, nextReviewAt: null },
      'no-such-module': { bestQuiz: 5, reviewStep: 0, nextReviewAt: null },
      [TRACKS[1].modules[0].id]: { bestQuiz: 'five', reviewStep: 0, nextReviewAt: null },
    }))
    expect(Object.keys(loadLearn())).toEqual([id])
    recordQuiz('no-such-module', 5)
    expect(loadLearn()['no-such-module']).toBeUndefined()
  })

  it('corruptStorageIsEmpty', () => {
    localStorage.setItem(LEARN_KEY, '{nope')
    expect(loadLearn()).toEqual({})
  })

  it('announcesChanges', () => {
    const seen = vi.fn()
    window.addEventListener(LEARN_EVENT, seen)
    recordQuiz(id, 4)
    window.removeEventListener(LEARN_EVENT, seen)
    expect(seen).toHaveBeenCalledTimes(1)
  })
})
