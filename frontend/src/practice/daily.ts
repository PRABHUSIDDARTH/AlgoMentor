import { STAGES } from '@/content/roadmap'
import { weightsFor } from '@/content/targets'
import { isUnlocked, stageCompletion, type Progress } from './progress'
import { isDue } from './schedule'
import type { ProfileSettings } from './store'

export type DailyItem = { id: string; kind: 'new' | 'review' | 'refresher'; problemId?: string; stageId?: string; patternId?: string; moduleId?: string }
export type Day = { items: DailyItem[]; completedIds: string[] }

export const DAILY_KEY = 'algomentor.daily.v1'
export const MAX_REVIEWS = 5
const KEEP_DAYS = 120

/** YYYY-MM-DD in the learner's local time zone. */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0
  return h
}

/**
 * Today's checklist: `dailyGoal` new problems (current stage first, then other open stages by
 * target weight), up to 5 due reviews (oldest first), and one refresher: a Learn module whose
 * re-quiz is due, otherwise a pattern from a finished stage.
 */
export function buildPlan(dateKey: string, settings: ProfileSettings, progress: Progress, unlocks: string[], now: number, dueModuleIds: string[] = []): DailyItem[] {
  const weights = weightsFor(settings.target)
  const open = STAGES.filter((s) => isUnlocked(s.id, progress, unlocks) && stageCompletion(s.id, progress).ratio < 1)
  const [current, ...rest] = open
  const ordered = current ? [current, ...rest.sort((a, b) => (weights[b.id] ?? 0) - (weights[a.id] ?? 0) || a.order - b.order)] : []
  const fresh = ordered
    .flatMap((s) => s.patterns.flatMap((p) => p.problems.map((q) => ({ q, s }))))
    .filter(({ q }) => progress[q.id]?.status !== 'solved')
    .slice(0, settings.dailyGoal)
    .map(({ q, s }): DailyItem => ({ id: `new:${q.id}`, kind: 'new', problemId: q.id, stageId: s.id }))

  const reviews = Object.entries(progress)
    .filter(([, p]) => p.status === 'solved' && isDue(p.nextReviewAt, now))
    .sort(([, a], [, b]) => (a.nextReviewAt ?? 0) - (b.nextReviewAt ?? 0))
    .slice(0, MAX_REVIEWS)
    .map(([id]): DailyItem => ({ id: `review:${id}`, kind: 'review', problemId: id }))

  if (dueModuleIds.length) {
    const id = dueModuleIds[0]
    return [...fresh, ...reviews, { id: `refresher:module:${id}`, kind: 'refresher', moduleId: id }]
  }

  const finished = STAGES.filter((s) => stageCompletion(s.id, progress).ratio === 1).flatMap((s) => s.patterns.map((p) => ({ p, s })))
  const pick = finished.length ? finished[hash(dateKey) % finished.length] : null
  const refresher: DailyItem[] = pick ? [{ id: `refresher:${pick.p.id}`, kind: 'refresher', patternId: pick.p.id, stageId: pick.s.id }] : []

  return [...fresh, ...reviews, ...refresher]
}

function validDay(d: unknown): d is Day {
  const v = d as Day
  return !!v && Array.isArray(v.items) && Array.isArray(v.completedIds)
    && v.items.every((i) => i && typeof i.id === 'string' && ['new', 'review', 'refresher'].includes(i.kind))
    && v.completedIds.every((c) => typeof c === 'string')
}

export function loadDays(): Record<string, Day> {
  try {
    const raw = JSON.parse(localStorage.getItem(DAILY_KEY) ?? '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    return Object.fromEntries(Object.entries(raw).filter(([k, d]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && validDay(d))) as Record<string, Day>
  } catch {
    return {}
  }
}

function saveDays(days: Record<string, Day>): void {
  const keys = Object.keys(days).sort().slice(-KEEP_DAYS)
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(Object.fromEntries(keys.map((k) => [k, days[k]]))))
  } catch {
    // Storage full or blocked.
  }
}

/** The day's plan, generated once (on first visit that day) and kept afterwards. */
export function getDay(dateKey: string, build: () => DailyItem[]): Day {
  const days = loadDays()
  if (days[dateKey]) return days[dateKey]
  const day = { items: build(), completedIds: [] }
  saveDays({ ...days, [dateKey]: day })
  return day
}

export function markItem(dateKey: string, itemId: string, done: boolean): Day | null {
  const days = loadDays()
  const day = days[dateKey]
  if (!day) return null
  const completedIds = done ? [...new Set([...day.completedIds, itemId])] : day.completedIds.filter((c) => c !== itemId)
  const next = { ...day, completedIds }
  saveDays({ ...days, [dateKey]: next })
  return next
}

/** A day counts towards the streak when every new problem on it was done. */
function complete(day: Day | undefined): boolean {
  if (!day) return false
  const required = day.items.filter((i) => i.kind === 'new')
  const list = required.length ? required : day.items
  return list.length > 0 && list.every((i) => day.completedIds.includes(i.id))
}

function shiftKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d + days))
}

/** Consecutive complete days ending today (or yesterday, if today isn't finished yet). */
export function streak(days: Record<string, Day>, todayKey: string): number {
  let key = complete(days[todayKey]) ? todayKey : shiftKey(todayKey, -1)
  let n = 0
  while (complete(days[key])) {
    n++
    key = shiftKey(key, -1)
  }
  return n
}

export function last14(days: Record<string, Day>, todayKey: string): { dateKey: string; state: 'complete' | 'partial' | 'none' }[] {
  return Array.from({ length: 14 }, (_, i) => {
    const dateKey = shiftKey(todayKey, i - 13)
    const day = days[dateKey]
    const state = complete(day) ? 'complete' : day && day.completedIds.length ? 'partial' : 'none'
    return { dateKey, state }
  })
}
