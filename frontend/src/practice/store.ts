import { GITHUB_USER, LINKEDIN_USER, type Site } from './profileUrls'

export type Tier = 'maang' | 'product' | 'startup' | 'service'
export type Role = 'intern' | 'sde1' | 'sde2' | 'sde3'
/** What kind of engineer: changes how much each Core CS track counts. */
export type Focus = 'general' | 'backend' | 'frontend' | 'fullstack' | 'mobile' | 'data' | 'devops' | 'sdet'
/** `company` is the tier. `employer` is a company id from the dataset, set from the Companies pages or Settings. */
export type Target = { company: Tier; role: Role; employer?: string; focus?: Focus }
export type DailyGoal = 2 | 3 | 5
export type ProfileSettings = {
  leetcode?: string
  hackerrank?: string
  gfg?: string
  github?: string
  /** LinkedIn can only be linked to, not read. */
  linkedin?: string
  /** Shown on the dream ID card. */
  name?: string
  /** Kept in this browser; only sent if the learner adds it to a contribution. */
  email?: string
  target: Target
  dailyGoal: DailyGoal
}

export const SETTINGS_KEY = 'algomentor.profile.v1'
export const STATS_KEY = 'algomentor.stats.v1'
/** Fired on window whenever settings or stats change, so every page stays in sync. */
export const SETTINGS_EVENT = 'algomentor:settings'

export const DEFAULT_SETTINGS: ProfileSettings = { target: { company: 'maang', role: 'sde1' }, dailyGoal: 3 }

const USERNAME = /^[A-Za-z0-9_.-]{1,40}$/
const NAME = /^[^<>{}\n]{1,60}$/
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/
export const TIERS: Tier[] = ['maang', 'product', 'startup', 'service']
export const ROLES: Role[] = ['intern', 'sde1', 'sde2', 'sde3']
export const FOCUSES: Focus[] = ['general', 'backend', 'frontend', 'fullstack', 'mobile', 'data', 'devops', 'sdet']
const EMPLOYER_ID = /^[a-z0-9-]{1,40}$/
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
  // Settings saved before the tier rename stored 'faang'.
  const company = (t?.company as string) === 'faang' ? 'maang' : t?.company
  if (!t || !company || !TIERS.includes(company) || !ROLES.includes(t.role) || !GOALS.includes(v.dailyGoal as DailyGoal)) {
    return DEFAULT_SETTINGS
  }
  const target: Target = { company, role: t.role }
  if (typeof t.employer === 'string' && EMPLOYER_ID.test(t.employer)) target.employer = t.employer
  if (t.focus && FOCUSES.includes(t.focus)) target.focus = t.focus
  const out: ProfileSettings = { target, dailyGoal: v.dailyGoal as DailyGoal }
  for (const site of ['leetcode', 'hackerrank', 'gfg'] as const) {
    const u = v[site]
    if (u !== undefined) {
      if (typeof u !== 'string' || !USERNAME.test(u)) return DEFAULT_SETTINGS
      out[site] = u
    }
  }
  // Identity fields added later: a bad value is dropped on its own rather than resetting everything.
  const ok = (x: unknown, re: RegExp): x is string => typeof x === 'string' && re.test(x)
  if (ok(v.github, GITHUB_USER)) out.github = v.github
  if (ok(v.linkedin, LINKEDIN_USER)) out.linkedin = v.linkedin
  if (ok(v.name, NAME)) out.name = v.name
  if (ok(v.email, EMAIL)) out.email = v.email
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
  github: (d) => str(d.username) && num(d.publicRepos) && num(d.followers) && num(d.stars) && Array.isArray(d.languages) && d.languages.every(str) && numOrNull(d.lastPushAt),
}

export function loadStats(): Partial<Record<Site, StatsEntry>> {
  const v = read(STATS_KEY)
  if (!v || typeof v !== 'object') return {}
  const out: Partial<Record<Site, StatsEntry>> = {}
  for (const site of ['leetcode', 'hackerrank', 'gfg', 'github'] as const) {
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
