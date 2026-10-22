import type { LeetCodeProfile } from '@/lib/api'
import { PROBLEMS, STAGES } from '@/content/roadmap'
import { isDue, MASTERED_STEP, nextReviewAt } from './schedule'

export type ProblemProgress = {
  status: 'solved' | 'attempted'
  firstSolvedAt?: number
  lastReviewedAt?: number
  reviewStep: number
  nextReviewAt: number | null
  /** Marked as already known (prior experience), never scheduled for review. */
  known?: boolean
}
export type Progress = Record<string, ProblemProgress>

export const PROGRESS_KEY = 'algomentor.progress.v1'
export const UNLOCKS_KEY = 'algomentor.unlocks.v1'
/** Fired on window after every change, with `detail: { ids }` of the problems that changed. */
export const PROGRESS_EVENT = 'algomentor:progress'
export const UNLOCK_THRESHOLD = 0.7
export const REVIEW_LOG_KEY = 'algomentor.reviews.v1'
const MAX_LOG = 500

export type ReviewOutcome = { id: string; at: number; passed: boolean }

/** Outcomes of due reviews (newest last), for the retention score. */
export function loadReviewLog(): ReviewOutcome[] {
  try {
    const raw = JSON.parse(localStorage.getItem(REVIEW_LOG_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((r) => r && typeof r.id === 'string' && typeof r.at === 'number' && typeof r.passed === 'boolean') : []
  } catch {
    return []
  }
}

function logReview(outcome: ReviewOutcome): void {
  try {
    localStorage.setItem(REVIEW_LOG_KEY, JSON.stringify([...loadReviewLog(), outcome].slice(-MAX_LOG)))
  } catch {
    // Storage full or blocked.
  }
}

function valid(p: unknown): p is ProblemProgress {
  const v = p as ProblemProgress
  return !!v && typeof v === 'object' && (v.status === 'solved' || v.status === 'attempted')
    && Number.isInteger(v.reviewStep) && v.reviewStep >= 0 && v.reviewStep <= MASTERED_STEP
    && (v.nextReviewAt === null || typeof v.nextReviewAt === 'number')
    && (v.firstSolvedAt === undefined || typeof v.firstSolvedAt === 'number')
    && (v.lastReviewedAt === undefined || typeof v.lastReviewedAt === 'number')
}

/** Saved progress; problems no longer in the roadmap and malformed records are dropped. */
export function loadProgress(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    return Object.fromEntries(Object.entries(raw).filter(([id, p]) => PROBLEMS.has(id) && valid(p))) as Progress
  } catch {
    return {}
  }
}

function save(progress: Progress, ids: string[]): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // Storage full or blocked: the session still sees the event.
  }
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: { ids } }))
}

/**
 * A solve of a roadmap problem. The first solve schedules the first review; a later solve on or
 * after its due day is a review (advance one step if no hints, back to step 0 otherwise).
 */
export function recordSolve(id: string, { hintsUsed, now = Date.now() }: { hintsUsed: number; now?: number }): void {
  if (!PROBLEMS.has(id)) return
  const progress = loadProgress()
  const current = progress[id]
  if (!current || current.status !== 'solved') {
    progress[id] = { status: 'solved', firstSolvedAt: now, lastReviewedAt: now, reviewStep: 0, nextReviewAt: nextReviewAt(0, now) }
  } else if (isDue(current.nextReviewAt, now)) {
    logReview({ id, at: now, passed: hintsUsed === 0 })
    const step = hintsUsed === 0 ? current.reviewStep + 1 : 0
    progress[id] = { ...current, lastReviewedAt: now, reviewStep: step, nextReviewAt: nextReviewAt(step, now) }
  } else {
    return
  }
  save(progress, [id])
}

/** Brings a solved problem's next review forward to `at` (never later than already scheduled). */
export function scheduleReview(id: string, at: number): void {
  const progress = loadProgress()
  const current = progress[id]
  if (!current || current.status !== 'solved') return
  if (current.nextReviewAt !== null && current.nextReviewAt <= at) return
  progress[id] = { ...current, nextReviewAt: at, reviewStep: Math.min(current.reviewStep, MASTERED_STEP - 1), known: undefined }
  save(progress, [id])
}

/** Un-ticks a problem (e.g. ticked by mistake on the roadmap). */
export function clearProblem(id: string): void {
  const progress = loadProgress()
  if (!(id in progress)) return
  delete progress[id]
  save(progress, [id])
}

/** A review the learner couldn't complete: back to step 0, due again tomorrow. */
export function recordReviewFailed(id: string, now = Date.now()): void {
  const progress = loadProgress()
  const current = progress[id]
  if (!current || current.status !== 'solved') return
  logReview({ id, at: now, passed: false })
  progress[id] = { ...current, lastReviewedAt: now, reviewStep: 0, nextReviewAt: nextReviewAt(0, now), known: undefined }
  save(progress, [id])
}

export function markStageKnown(stageId: string, now = Date.now()): void {
  const stage = STAGES.find((s) => s.id === stageId)
  if (!stage) return
  const progress = loadProgress()
  const ids: string[] = []
  for (const q of stage.patterns.flatMap((p) => p.problems)) {
    if (progress[q.id]?.status === 'solved') continue
    progress[q.id] = { status: 'solved', firstSolvedAt: now, reviewStep: MASTERED_STEP, nextReviewAt: null, known: true }
    ids.push(q.id)
  }
  save(progress, ids)
}

/** Marks roadmap problems the learner recently solved on LeetCode; returns how many were new. */
export function syncFromLeetCode(recent: LeetCodeProfile['recent']): number {
  const progress = loadProgress()
  const ids: string[] = []
  for (const r of recent) {
    if (!PROBLEMS.has(r.slug) || progress[r.slug]?.status === 'solved') continue
    const at = r.solvedAt * 1000
    progress[r.slug] = { status: 'solved', firstSolvedAt: at, lastReviewedAt: at, reviewStep: 0, nextReviewAt: nextReviewAt(0, at) }
    ids.push(r.slug)
  }
  if (ids.length) save(progress, ids)
  return ids.length
}

export function stageCompletion(stageId: string, progress: Progress): { solved: number; total: number; ratio: number } {
  const stage = STAGES.find((s) => s.id === stageId)
  const all = stage ? stage.patterns.flatMap((p) => p.problems) : []
  const solved = all.filter((q) => progress[q.id]?.status === 'solved').length
  return { solved, total: all.length, ratio: all.length ? solved / all.length : 0 }
}

export function loadUnlocks(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(UNLOCKS_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((id) => typeof id === 'string' && STAGES.some((s) => s.id === id)) : []
  } catch {
    return []
  }
}

export function unlockStage(stageId: string): void {
  const unlocks = loadUnlocks()
  if (unlocks.includes(stageId)) return
  try {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify([...unlocks, stageId]))
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: { ids: [] } }))
}

/** Stage 1 is always open; later stages open at 70% of the previous one, or when unlocked by hand. */
export function isUnlocked(stageId: string, progress: Progress, manual: string[]): boolean {
  const index = STAGES.findIndex((s) => s.id === stageId)
  if (index <= 0) return index === 0
  if (manual.includes(stageId)) return true
  return stageCompletion(STAGES[index - 1].id, progress).ratio >= UNLOCK_THRESHOLD
}
