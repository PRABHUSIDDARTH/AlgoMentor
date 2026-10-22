import { CHALLENGE_IDS } from '@/content/learn/types'

export type LinkedRepo = { owner: string; repo: string; linkedAt: number }
export type CheckDetail = { ok: boolean; text: string }
export type CheckRecord = {
  checkedAt: number
  /** The latest check passed. */
  passed: boolean
  /** When the check first passed. Kept when a later check fails (repo renamed, deleted or made private). */
  passedAt?: number
  details: CheckDetail[]
  /** Why the latest check couldn't run (for example a private repository). */
  error?: string
}
export type GitState = { repos: Record<string, LinkedRepo>; checks: Record<string, CheckRecord> }
export type CheckOutcome = { passed: boolean; details: CheckDetail[] } | { error: string }

export const GIT_KEY = 'algomentor.git.v1'
/** Fired on window after every change. */
export const GIT_EVENT = 'algomentor:git'
/** The scope (storage key prefix) for the Git page's own repository, outside any project. */
export const PRACTICE_SCOPE = 'practice'

const FORMAT_ERROR = 'Use a repository link like https://github.com/you/your-repo.'
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/
const REPO = /^[A-Za-z0-9_.-]{1,100}$/

/**
 * Reads owner and repo from the ways people copy a GitHub repository link: https, ssh, with or without
 * ".git", a trailing slash, or a deeper page such as /tree/main. Anything else is a format error.
 */
export function parseRepoUrl(input: string): { owner: string; repo: string } | { error: string } {
  const text = input.trim()
  const m = /^(?:(?:https?|ssh):\/\/(?:git@)?(?:www\.)?github\.com\/|git@github\.com:|(?:www\.)?github\.com\/)([^/\s?#]+)\/([^/\s?#]+)(?:[/?#].*)?$/i.exec(text)
  if (!m) return { error: FORMAT_ERROR }
  const owner = m[1]
  const repo = m[2].replace(/\.git$/i, '')
  if (!OWNER.test(owner) || !REPO.test(repo) || /^\.+$/.test(repo)) return { error: FORMAT_ERROR }
  return { owner, repo }
}

export function checkKey(scope: string, challengeId: string): string {
  return `${scope}:${challengeId}`
}

const isDetail = (d: unknown): d is CheckDetail => !!d && typeof d === 'object' && typeof (d as CheckDetail).ok === 'boolean' && typeof (d as CheckDetail).text === 'string'

function validRepo(r: unknown): r is LinkedRepo {
  const v = r as LinkedRepo
  return !!v && typeof v === 'object' && typeof v.owner === 'string' && OWNER.test(v.owner) && typeof v.repo === 'string' && REPO.test(v.repo) && typeof v.linkedAt === 'number'
}

function validCheck(key: string, c: unknown): c is CheckRecord {
  const v = c as CheckRecord
  const id = key.slice(key.indexOf(':') + 1)
  return key.includes(':') && (CHALLENGE_IDS as readonly string[]).includes(id) && !!v && typeof v === 'object'
    && typeof v.passed === 'boolean' && typeof v.checkedAt === 'number' && Array.isArray(v.details) && v.details.every(isDetail)
    && (v.passedAt === undefined || typeof v.passedAt === 'number') && (v.error === undefined || typeof v.error === 'string')
}

/** Linked repositories and check results; malformed records are dropped. */
export function loadGit(): GitState {
  try {
    const raw = JSON.parse(localStorage.getItem(GIT_KEY) ?? '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { repos: {}, checks: {} }
    const entries = (o: unknown) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.entries(o) : [])
    return {
      repos: Object.fromEntries(entries(raw.repos).filter(([, r]) => validRepo(r))) as Record<string, LinkedRepo>,
      checks: Object.fromEntries(entries(raw.checks).filter(([k, c]) => validCheck(k, c))) as Record<string, CheckRecord>,
    }
  } catch {
    return { repos: {}, checks: {} }
  }
}

function save(state: GitState): void {
  try {
    localStorage.setItem(GIT_KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked: the page still sees the event.
  }
  window.dispatchEvent(new CustomEvent(GIT_EVENT))
}

/** Links a repository to a project (or the practice scope). A different repository starts with a clean slate. */
export function linkRepo(scope: string, owner: string, repo: string, now = Date.now()): void {
  const state = loadGit()
  const old = state.repos[scope]
  const same = old && old.owner.toLowerCase() === owner.toLowerCase() && old.repo.toLowerCase() === repo.toLowerCase()
  state.repos[scope] = { owner, repo, linkedAt: same ? old.linkedAt : now }
  if (old && !same) {
    state.checks = Object.fromEntries(Object.entries(state.checks).filter(([k]) => !k.startsWith(`${scope}:`)))
  }
  save(state)
}

/** Removes the link but keeps what was already passed. */
export function unlinkRepo(scope: string): void {
  const state = loadGit()
  delete state.repos[scope]
  save(state)
}

/** Stores a check result. The first passing date survives later failures. */
export function recordCheck(key: string, outcome: CheckOutcome, now = Date.now()): void {
  const state = loadGit()
  const before = state.checks[key]
  const passedAt = 'error' in outcome ? before?.passedAt : outcome.passed ? (before?.passedAt ?? now) : before?.passedAt
  state.checks[key] = 'error' in outcome
    ? { checkedAt: now, passed: false, details: [], error: outcome.error, ...(passedAt === undefined ? {} : { passedAt }) }
    : { checkedAt: now, passed: outcome.passed, details: outcome.details, ...(passedAt === undefined ? {} : { passedAt }) }
  save(state)
}
