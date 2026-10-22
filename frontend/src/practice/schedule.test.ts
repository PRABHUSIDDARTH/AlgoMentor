import { describe, expect, it } from 'vitest'
import { DAY_MS, isDue, nextReviewAt, REVIEW_DAYS, startOfLocalDay } from './schedule'

const NOON = new Date(2026, 9, 22, 12, 0).getTime() // Oct 22, local noon

describe('schedule', () => {
  it('intervalsFollow1_3_7_21_60', () => {
    expect(REVIEW_DAYS).toEqual([1, 3, 7, 21, 60])
    REVIEW_DAYS.forEach((days, step) => {
      expect(nextReviewAt(step, NOON)).toBe(startOfLocalDay(NOON) + days * DAY_MS)
    })
  })

  it('masteredAfterStep4', () => {
    expect(nextReviewAt(5, NOON)).toBeNull()
  })

  it('dueByTheEndOfTheLocalDay', () => {
    const due = nextReviewAt(0, NOON)!
    expect(isDue(due, NOON)).toBe(false)
    expect(isDue(due, NOON + DAY_MS - 1000)).toBe(true) // tomorrow, any time
    expect(isDue(null, NOON + 1000 * DAY_MS)).toBe(false)
  })
})
