/** Spaced repetition: reviews fall due 1, 3, 7, 21 and 60 days after each successful solve. */
export const REVIEW_DAYS = [1, 3, 7, 21, 60] as const
export const MASTERED_STEP = REVIEW_DAYS.length
export const DAY_MS = 24 * 60 * 60 * 1000

/** Midnight at the start of `t`'s local calendar day. */
export function startOfLocalDay(t: number): number {
  const d = new Date(t)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** When a problem at review `step` is next due, measured in local days from `from`; null once mastered. */
export function nextReviewAt(step: number, from: number): number | null {
  if (step >= MASTERED_STEP) return null
  const start = new Date(startOfLocalDay(from))
  // Add calendar days (not 24h blocks) so DST changes never shift a review onto the wrong day.
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + REVIEW_DAYS[step]).getTime()
}

/** Due any time on or after its due day (reviews are "due today", not at an exact minute). */
export function isDue(at: number | null, now: number): boolean {
  if (at === null) return false
  const end = new Date(startOfLocalDay(now))
  return at < new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).getTime()
}
