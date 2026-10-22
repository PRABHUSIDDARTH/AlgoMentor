import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { ChecklistItem } from '@/components/practice/ChecklistItem'
import { StreakStrip } from '@/components/practice/StreakStrip'
import { Button } from '@/components/ui/button'
import { PROBLEMS, STAGES } from '@/content/roadmap'
import { buildPlan, getDay, last14, loadDays, localDateKey, markItem, streak, type Day, type DailyItem } from '@/practice/daily'
import { loadProgress, loadUnlocks, PROGRESS_EVENT, recordReviewFailed, recordSolve } from '@/practice/progress'
import { solveHref } from '@/practice/roadmapView'
import { useLevel } from '@/practice/useLevel'
import { useSettings } from '@/practice/useSettings'
import { ModuleRefresher } from '@/components/learn/ModuleRefresher'
import { dueModules } from '@/learn/progress'
import { useCore } from '@/learn/useCore'
import type { ProfileSettings } from '@/practice/store'
import { ReadinessMeter } from '@/components/practice/ReadinessMeter'
import { COMPANY_LABEL, ROLE_LABEL } from '@/content/targets'

const PATTERNS = new Map(STAGES.flatMap((s) => s.patterns.map((p) => [p.id, { p, s }] as const)))

/** Today's key, re-read every minute so an open page rolls over at midnight. */
function useTodayKey(): string {
  const [key, setKey] = useState(() => localDateKey(new Date()))
  useEffect(() => {
    const id = setInterval(() => setKey(localDateKey(new Date())), 60_000)
    return () => clearInterval(id)
  }, [])
  return key
}

/** Ticks items whose problem was solved (or reviewed) today while this page wasn't open. */
function reconcile(todayKey: string, day: Day): Day {
  const progress = loadProgress()
  const [y, m, d] = todayKey.split('-').map(Number)
  const start = new Date(y, m - 1, d).getTime()
  let latest = day
  for (const item of day.items) {
    const p = item.problemId ? progress[item.problemId] : undefined
    if (!p || p.status !== 'solved' || day.completedIds.includes(item.id)) continue
    const at = item.kind === 'new' ? p.firstSolvedAt : p.lastReviewedAt
    if (at !== undefined && at >= start) latest = markItem(todayKey, item.id, true) ?? latest
  }
  return latest
}

const planFor = (todayKey: string, settings: ProfileSettings) =>
  reconcile(todayKey, getDay(todayKey, () => buildPlan(todayKey, settings, loadProgress(), loadUnlocks(), Date.now(), dueModules())))

export default function Today() {
  const todayKey = useTodayKey()
  const [settings] = useSettings()
  const navigate = useNavigate()
  const level = useLevel()
  const core = useCore()
  // Interviews test both, so the overall figure is the lower of the two.
  const overall = Math.min(level.readiness, core.readiness)
  const [day, setDay] = useState<Day>(() => planFor(todayKey, settings))
  const [days, setDays] = useState(loadDays)

  // New day while the page is open: build (or load) that day's plan.
  useEffect(() => {
    setDay(planFor(todayKey, settings))
    setDays(loadDays())
  }, [todayKey]) // settings changes apply from the next day; today's plan stays stable

  // Solving or reviewing a listed problem anywhere ticks its item.
  useEffect(() => {
    const onProgress = (e: Event) => {
      const ids: string[] = (e as CustomEvent).detail?.ids ?? []
      const progress = loadProgress()
      let latest: Day | null = null
      for (const item of day.items) {
        if (!item.problemId || !ids.includes(item.problemId) || day.completedIds.includes(item.id)) continue
        if (progress[item.problemId]?.status === 'solved') latest = markItem(todayKey, item.id, true) ?? latest
      }
      if (latest) {
        setDay(latest)
        setDays(loadDays())
      }
    }
    window.addEventListener(PROGRESS_EVENT, onProgress)
    return () => window.removeEventListener(PROGRESS_EVENT, onProgress)
  }, [day, todayKey])

  const toggle = (item: DailyItem, done: boolean) => {
    // Ticking by hand means "I solved it elsewhere": record it so the roadmap and reviews agree.
    if (done && item.problemId) recordSolve(item.problemId, { hintsUsed: 0 })
    const next = markItem(todayKey, item.id, done)
    if (next) setDay(next)
    setDays(loadDays())
  }

  const groups = useMemo(() => ({
    fresh: day.items.filter((i) => i.kind === 'new'),
    reviews: day.items.filter((i) => i.kind === 'review'),
    refresher: day.items.find((i) => i.kind === 'refresher'),
  }), [day])
  const total = day.items.length
  const done = day.completedIds.filter((id) => day.items.some((i) => i.id === id)).length
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const refresher = groups.refresher?.patternId ? PATTERNS.get(groups.refresher.patternId) : undefined
  const currentStreak = streak(days, todayKey)

  const row = (item: DailyItem, note?: string, extra?: React.ReactNode) => {
    const entry = item.problemId ? PROBLEMS.get(item.problemId) : undefined
    return entry ? <ChecklistItem key={item.id} problem={entry.problem} done={day.completedIds.includes(item.id)} onToggle={(d) => toggle(item, d)} note={note} extra={extra} /> : null
  }

  return (
    <AppShell>
      <div className="grid gap-8 px-6 py-8 sm:px-10 lg:px-14 xl:grid-cols-[minmax(0,1fr)_340px] xl:px-20">
        <div className="grid content-start gap-7">
          <PageHeader eyebrow={dateLabel} title="Today's plan">
            <p className="font-mono text-[12px] text-ink-muted">{done} of {total} done</p>
          </PageHeader>

          <section aria-labelledby="t-new" className="grid gap-2.5">
            <h2 id="t-new" className="text-[16px] font-semibold">New problems</h2>
            {groups.fresh.length ? (
              <ul aria-label="New problems" className="overflow-hidden rounded-lg border border-line bg-cream">{groups.fresh.map((i) => row(i))}</ul>
            ) : (
              <p className="text-[13.5px] text-ink-muted">Every open stage is complete. <Link to="/roadmap" className="text-ink underline underline-offset-[3px]">Unlock the next one</Link> to keep going.</p>
            )}
          </section>

          <section aria-labelledby="t-reviews" className="grid gap-2.5">
            <h2 id="t-reviews" className="text-[16px] font-semibold">Reviews due</h2>
            {groups.reviews.length ? (
              <ul aria-label="Reviews due" className="overflow-hidden rounded-lg border border-line bg-cream">
                {groups.reviews.map((i) => row(i, 'solve again without hints', !day.completedIds.includes(i.id) && (
                  <button type="button" className="text-[12px] text-ink-muted underline underline-offset-[3px] hover:text-ink" onClick={() => { recordReviewFailed(i.problemId!); setDay(markItem(todayKey, i.id, true) ?? day); setDays(loadDays()) }}>
                    Couldn't solve it
                  </button>
                )))}
              </ul>
            ) : (
              <p className="text-[13.5px] text-ink-muted">No reviews due today. Solved problems come back after 1, 3, 7, 21 and 60 days.</p>
            )}
          </section>

          {groups.refresher?.moduleId && (
            <ModuleRefresher
              moduleId={groups.refresher.moduleId}
              dateKey={todayKey}
              done={day.completedIds.includes(groups.refresher.id)}
              onDone={() => { const next = markItem(todayKey, groups.refresher!.id, true); if (next) setDay(next); setDays(loadDays()) }}
            />
          )}

          {refresher && groups.refresher && (
            <section aria-labelledby="t-refresh" className="grid gap-2.5 rounded-lg border border-line bg-sand px-5 py-4">
              <h2 id="t-refresh" className="eyebrow">Concept refresher · {refresher.s.title}</h2>
              <p className="text-[15px] font-semibold">{refresher.p.title}</p>
              <p className="max-w-[70ch] text-[13.5px] leading-relaxed text-ink-muted">{refresher.p.idea}</p>
              <div className="flex flex-wrap items-center gap-4 text-[13px]">
                <Link to={solveHref(refresher.p.problems[0])} className="underline underline-offset-[3px]">Open a problem</Link>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={day.completedIds.includes(groups.refresher.id)} onChange={(e) => toggle(groups.refresher!, e.target.checked)} className="size-4 accent-[var(--sage)]" />
                  Refreshed
                </label>
              </div>
            </section>
          )}
        </div>

        <aside aria-label="Progress" className="grid content-start gap-5">
          <div className="grid gap-3 rounded-lg border border-line bg-sand px-5 py-5">
            <p className="text-[15px] font-semibold">Level {level.level}</p>
            <ReadinessMeter value={overall} label={`Readiness for ${COMPANY_LABEL[settings.target.company]} ${ROLE_LABEL[settings.target.role]}`} />
            <p className="font-mono text-[11.5px] text-ink-muted">DSA {level.readiness}% · Core CS {core.readiness}%</p>
            <p className="text-[12px] leading-relaxed text-ink-muted">The lower one counts, because interviews test both.</p>
            <Link to="/level" className="text-[13px] underline underline-offset-[3px]">See what to improve</Link>
          </div>
          <div className="grid gap-3 rounded-lg border border-line bg-sand px-5 py-5">
            <p className="text-[15px] font-semibold">Streak: {currentStreak} {currentStreak === 1 ? 'day' : 'days'}</p>
            <StreakStrip days={last14(days, todayKey)} />
            <p className="text-[12px] text-ink-muted">A day counts when all its new problems are done.</p>
          </div>
          <div className="grid gap-3 rounded-lg border border-line bg-sand px-5 py-5">
            <p className="text-[15px] font-semibold">Test yourself</p>
            <p className="text-[13px] leading-relaxed text-ink-muted">10 problems mixed across the stages you've opened: some you've solved, most you haven't. 60 minutes.</p>
            <Button className="bg-sage font-semibold text-on-sage hover:bg-sage/90" onClick={() => navigate(`/test/new?level=${level.level}`)}>Generate test</Button>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}
