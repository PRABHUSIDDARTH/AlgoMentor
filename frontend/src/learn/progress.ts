import { MODULES } from '@/content/learn'
import { isDue, MASTERED_STEP, nextReviewAt } from '@/practice/schedule'

export type ModuleProgress = { completedAt?: number; bestQuiz: number; reviewStep: number; nextReviewAt: number | null }
export type LearnProgress = Record<string, ModuleProgress>

export const LEARN_KEY = 'algomentor.learn.v1'
/** Fired on window after every change, with `detail: { id }`. */
export const LEARN_EVENT = 'algomentor:learn'
export const PASS_SCORE = 4
/** Re-quiz questions a review needs right to count as remembered. */
export const REQUIZ_PASS = 2

function valid(p: unknown): p is ModuleProgress {
  const v = p as ModuleProgress
  return !!v && typeof v === 'object' && Number.isInteger(v.bestQuiz) && v.bestQuiz >= 0 && v.bestQuiz <= 5
    && Number.isInteger(v.reviewStep) && v.reviewStep >= 0 && v.reviewStep <= MASTERED_STEP
    && (v.nextReviewAt === null || typeof v.nextReviewAt === 'number')
    && (v.completedAt === undefined || typeof v.completedAt === 'number')
}

/** Saved module progress; unknown modules and malformed records are dropped. */
export function loadLearn(): LearnProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(LEARN_KEY) ?? '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    return Object.fromEntries(Object.entries(raw).filter(([id, p]) => MODULES.has(id) && valid(p))) as LearnProgress
  } catch {
    return {}
  }
}

function update(id: string, change: (current: ModuleProgress) => ModuleProgress): void {
  if (!MODULES.has(id)) return
  const all = loadLearn()
  all[id] = change(all[id] ?? { bestQuiz: 0, reviewStep: 0, nextReviewAt: null })
  try {
    localStorage.setItem(LEARN_KEY, JSON.stringify(all))
  } catch {
    // Storage full or blocked: the page still sees the event.
  }
  window.dispatchEvent(new CustomEvent(LEARN_EVENT, { detail: { id } }))
}

/** Keeps the best score out of 5. */
export function recordQuiz(id: string, score: number): void {
  update(id, (p) => ({ ...p, bestQuiz: Math.max(p.bestQuiz, Math.max(0, Math.min(5, Math.round(score)))) }))
}

/** Completes a module once its quiz has been passed (4 of 5); the first review is scheduled. */
export function markModuleComplete(id: string, now = Date.now()): boolean {
  const p = loadLearn()[id]
  if (!p || p.bestQuiz < PASS_SCORE) return false
  if (p.completedAt === undefined) update(id, (c) => ({ ...c, completedAt: now, reviewStep: 0, nextReviewAt: nextReviewAt(0, now) }))
  return true
}

/** A due re-quiz: remembered moves to the next interval, forgotten starts again at day 1. */
export function recordReview(id: string, passed: boolean, now = Date.now()): void {
  update(id, (p) => {
    const step = passed ? Math.min(p.reviewStep + 1, MASTERED_STEP) : 0
    return { ...p, reviewStep: step, nextReviewAt: nextReviewAt(step, now) }
  })
}

/** Completed modules whose review is due, oldest first. */
export function dueModules(now = Date.now()): string[] {
  return Object.entries(loadLearn())
    .filter(([, p]) => p.completedAt !== undefined && isDue(p.nextReviewAt, now))
    .sort(([, a], [, b]) => (a.nextReviewAt ?? 0) - (b.nextReviewAt ?? 0))
    .map(([id]) => id)
}
