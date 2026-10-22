import type { Site } from './profileUrls'

export type Company = 'faang' | 'startup' | 'service'
export type Role = 'intern' | 'sde1' | 'sde2'
export type Target = { company: Company; role: Role }
export type DailyGoal = 2 | 3 | 5
export type ProfileSettings = { leetcode?: string; hackerrank?: string; gfg?: string; target: Target; dailyGoal: DailyGoal }

export const SETTINGS_KEY = 'algomentor.profile.v1'
export const STATS_KEY = 'algomentor.stats.v1'
/** Fired on window whenever settings or stats change, so every page stays in sync. */
export const SETTINGS_EVENT = 'algomentor:settings'

export const DEFAULT_SETTINGS: ProfileSettings = { target: { company: 'faang', role: 'sde1' }, dailyGoal: 3 }

const USERNAME = /^[A-Za-z0-9_.-]{1,40}$/
const COMPANIES: Company[] = ['faang', 'startup', 'service']
const ROLES: Role[] = ['intern', 'sde1', 'sde2']
const GOALS: DailyGoal[] = [2, 3, 5]

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the page keeps working with in-memory state.
  }
  window.dispatchEvent(new Event(SETTINGS_EVENT))
}

/** Saved settings, or the defaults when nothing valid is stored (storage is user-editable). */
export function loadSettings(): ProfileSettings {
  const v = read(SETTINGS_KEY) as Partial<ProfileSettings> | null
  if (!v || typeof v !== 'object') return DEFAULT_SETTINGS
  const t = v.target
  if (!t || !COMPANIES.includes(t.company) || !ROLES.includes(t.role) || !GOALS.includes(v.dailyGoal as DailyGoal)) {
    return DEFAULT_SETTINGS
  }
  const out: ProfileSettings = { target: { company: t.company, role: t.role }, dailyGoal: v.dailyGoal as DailyGoal }
  for (const site of ['leetcode', 'hackerrank', 'gfg'] as const) {
    const u = v[site]
    if (u !== undefined) {
      if (typeof u !== 'string' || !USERNAME.test(u)) return DEFAULT_SETTINGS
      out[site] = u
    }
  }
  return out
}

export function saveSettings(settings: ProfileSettings): void {
  write(SETTINGS_KEY, settings)
}

export type StatsEntry = { data: unknown; fetchedAt: number }

const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x)
const numOrNull = (x: unknown) => x === null || x === undefined || num(x)
const str = (x: unknown) => typeof x === 'string'

/** Shape checks per site, so stats saved by an older version (or edited by hand) can't crash a page. */
const VALID: Record<Site, (d: any) => boolean> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  leetcode: (d) => str(d.username) && numOrNull(d.ranking) && d.solved && ['easy', 'medium', 'hard', 'total'].every((k) => num(d.solved[k]))
    && Array.isArray(d.topics) && d.topics.every((t: any) => t && str(t.tag) && num(t.solved)) // eslint-disable-line @typescript-eslint/no-explicit-any
    && Array.isArray(d.recent) && d.recent.every((r: any) => r && str(r.slug) && str(r.title) && num(r.solvedAt)), // eslint-disable-line @typescript-eslint/no-explicit-any
  hackerrank: (d) => str(d.username) && Array.isArray(d.badges) && d.badges.every((b: any) => b && str(b.name) && num(b.stars) && num(b.level) && num(b.solved)), // eslint-disable-line @typescript-eslint/no-explicit-any
  gfg: (d) => str(d.username) && num(d.solved) && num(d.score) && numOrNull(d.instituteRank) && numOrNull(d.streak),
}

export function loadStats(): Partial<Record<Site, StatsEntry>> {
  const v = read(STATS_KEY)
  if (!v || typeof v !== 'object') return {}
  const out: Partial<Record<Site, StatsEntry>> = {}
  for (const site of ['leetcode', 'hackerrank', 'gfg'] as const) {
    const e = (v as Record<string, StatsEntry>)[site]
    if (e && typeof e === 'object' && typeof e.fetchedAt === 'number' && e.data && typeof e.data === 'object' && VALID[site](e.data)) out[site] = e
  }
  return out
}

export function saveStats(site: Site, data: unknown): void {
  write(STATS_KEY, { ...loadStats(), [site]: { data, fetchedAt: Date.now() } })
}

export function clearStats(site: Site): void {
  const stats = loadStats()
  delete stats[site]
  write(STATS_KEY, stats)
}
