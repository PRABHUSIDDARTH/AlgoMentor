import { afterEach, describe, expect, it } from 'vitest'
import { STAGES } from '@/content/roadmap'
import { DEFAULT_SETTINGS } from './store'
import { buildPlan, getDay, last14, localDateKey, loadDays, markItem, streak, type DailyItem } from './daily'
import { loadProgress, markStageKnown, recordSolve, type Progress } from './progress'
import { DAY_MS } from './schedule'

const NOON = new Date(2026, 9, 22, 12, 0).getTime()
const KEY = localDateKey(new Date(NOON))
const firstStageIds = STAGES[0].patterns.flatMap((p) => p.problems.map((q) => q.id))
const kinds = (items: DailyItem[], kind: DailyItem['kind']) => items.filter((i) => i.kind === kind)

afterEach(() => localStorage.clear())

describe('daily plan', () => {
  it('localDateKeyUsesLocalTime', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('newItemsMatchDailyGoal', () => {
    for (const goal of [2, 3, 5] as const) {
      const plan = buildPlan(KEY, { ...DEFAULT_SETTINGS, dailyGoal: goal }, {}, [], NOON)
      expect(kinds(plan, 'new')).toHaveLength(goal)
    }
  })

  it('newItemsComeFromCurrentStageInOrder', () => {
    const plan = buildPlan(KEY, DEFAULT_SETTINGS, {}, [], NOON)
    expect(kinds(plan, 'new').map((i) => i.problemId)).toEqual(firstStageIds.slice(0, 3))
  })

  it('newItemsSkipSolvedProblems', () => {
    recordSolve(firstStageIds[0], { hintsUsed: 0, now: NOON - 5 * DAY_MS })
    const plan = buildPlan(KEY, DEFAULT_SETTINGS, loadProgress(), [], NOON)
    expect(kinds(plan, 'new').map((i) => i.problemId)).toEqual(firstStageIds.slice(1, 4))
  })

  it('newItemsUseTargetWeightBetweenUnlockedStages', () => {
    // Finish stage 1 and unlock stages 2 and 14; for FAANG, graphs (weight 3) outranks... stage 2 is current, so it comes first.
    markStageKnown(STAGES[0].id, NOON)
    const plan = buildPlan(KEY, { ...DEFAULT_SETTINGS, dailyGoal: 5 }, loadProgress(), ['graphs'], NOON)
    const stageOf = (id: string) => STAGES.find((s) => s.patterns.some((p) => p.problems.some((q) => q.id === id)))!.id
    expect(kinds(plan, 'new').map((i) => stageOf(i.problemId!))).toEqual(['arrays', 'arrays', 'arrays', 'arrays', 'arrays'])
  })

  it('reviewsDueCappedAt5OldestFirst', () => {
    const progress: Progress = {}
    firstStageIds.slice(0, 7).forEach((id, i) => {
      progress[id] = { status: 'solved', firstSolvedAt: 0, reviewStep: 0, nextReviewAt: NOON - (10 - i) * DAY_MS }
    })
    const reviews = kinds(buildPlan(KEY, DEFAULT_SETTINGS, progress, [], NOON), 'review')
    expect(reviews.map((r) => r.problemId)).toEqual(firstStageIds.slice(0, 5))
  })

  it('oneRefresherFromACompletedStage', () => {
    expect(kinds(buildPlan(KEY, DEFAULT_SETTINGS, {}, [], NOON), 'refresher')).toHaveLength(0)
    markStageKnown(STAGES[0].id, NOON)
    const refreshers = kinds(buildPlan(KEY, DEFAULT_SETTINGS, loadProgress(), [], NOON), 'refresher')
    expect(refreshers).toHaveLength(1)
    expect(STAGES[0].patterns.map((p) => p.id)).toContain(refreshers[0].patternId)
  })

  it('planIsStableWithinADay', () => {
    const a = getDay(KEY, () => buildPlan(KEY, DEFAULT_SETTINGS, {}, [], NOON))
    recordSolve(firstStageIds[0], { hintsUsed: 0, now: NOON + 1000 })
    const b = getDay(KEY, () => buildPlan(KEY, DEFAULT_SETTINGS, loadProgress(), [], NOON + 1000))
    expect(b.items).toEqual(a.items)
  })

  it('buildsANewPlanAfterMidnight', () => {
    const lateEvening = new Date(2026, 9, 22, 23, 59).getTime()
    const justAfter = new Date(2026, 9, 23, 0, 1).getTime()
    const k1 = localDateKey(new Date(lateEvening))
    const k2 = localDateKey(new Date(justAfter))
    expect(k2).not.toBe(k1)
    const day1 = getDay(k1, () => buildPlan(k1, DEFAULT_SETTINGS, {}, [], lateEvening))
    markItem(k1, day1.items[0].id, true)
    getDay(k2, () => buildPlan(k2, DEFAULT_SETTINGS, {}, [], justAfter))
    expect(loadDays()[k1].completedIds).toEqual([day1.items[0].id])
    expect(loadDays()[k2].completedIds).toEqual([])
  })

  it('streakCountsCompleteDays', () => {
    const days: Record<string, { items: DailyItem[]; completedIds: string[] }> = {}
    for (let d = 1; d <= 3; d++) {
      const key = localDateKey(new Date(NOON - d * DAY_MS))
      days[key] = { items: [{ id: 'new:a', kind: 'new', problemId: 'two-sum' }], completedIds: ['new:a'] }
    }
    days[localDateKey(new Date(NOON - 5 * DAY_MS))] = { items: [{ id: 'new:a', kind: 'new', problemId: 'two-sum' }], completedIds: ['new:a'] }
    expect(streak(days, KEY)).toBe(3)
  })

  it('streakSurvivesUnfinishedTodayAndCountsFinishedToday', () => {
    const days: Record<string, { items: DailyItem[]; completedIds: string[] }> = {
      [localDateKey(new Date(NOON - DAY_MS))]: { items: [{ id: 'new:a', kind: 'new' }], completedIds: ['new:a'] },
      [KEY]: { items: [{ id: 'new:b', kind: 'new' }, { id: 'review:c', kind: 'review' }], completedIds: [] },
    }
    expect(streak(days, KEY)).toBe(1)
    days[KEY].completedIds = ['new:b']
    expect(streak(days, KEY)).toBe(2)
  })

  it('last14MarksDayStates', () => {
    const days = {
      [KEY]: { items: [{ id: 'new:a', kind: 'new' as const }, { id: 'new:b', kind: 'new' as const }], completedIds: ['new:a'] },
      [localDateKey(new Date(NOON - DAY_MS))]: { items: [{ id: 'new:a', kind: 'new' as const }], completedIds: ['new:a'] },
    }
    const strip = last14(days, KEY)
    expect(strip).toHaveLength(14)
    expect(strip[13]).toEqual({ dateKey: KEY, state: 'partial' })
    expect(strip[12].state).toBe('complete')
    expect(strip[0].state).toBe('none')
  })

  it('ignoresCorruptStorage', () => {
    localStorage.setItem('algomentor.daily.v1', '{"2026-10-22": {"items": "nope"}}')
    expect(loadDays()).toEqual({})
  })

describe('module refresher', () => {
  it('todayRefresherCanBeADueModule', () => {
    const plan = buildPlan(KEY, DEFAULT_SETTINGS, {}, [], NOON, ['classes-objects'])
    const refreshers = plan.filter((i) => i.kind === 'refresher')
    expect(refreshers).toEqual([{ id: 'refresher:module:classes-objects', kind: 'refresher', moduleId: 'classes-objects' }])
  })
})
})
