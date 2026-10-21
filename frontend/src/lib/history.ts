/** Recent problems, kept in this browser only (Phase 1 has no accounts). */

export type HistoryStatus = 'started' | 'hints' | 'explained' | 'solution' | 'solved'

export interface HistoryEntry {
  key: string
  source: 'leetcode' | 'custom'
  number?: string
  slug?: string
  title: string
  difficulty?: string
  /** Only stored for pasted problems; LeetCode ones are re-fetched. */
  statement?: string
  status: HistoryStatus
  hintsUsed: number
  hints: string[]
  updatedAt: number
}

export const HISTORY_KEY = 'algomentor.recent.v1'
export const MAX_HISTORY = 30
const MAX_HINTS = 4

const RANK: Record<HistoryStatus, number> = { started: 0, hints: 1, explained: 2, solution: 3, solved: 4 }

function isEntry(value: unknown): value is HistoryEntry {
  const e = value as HistoryEntry
  return !!e && typeof e.key === 'string' && typeof e.title === 'string' && e.status in RANK
    && typeof e.hintsUsed === 'number' && Array.isArray(e.hints) && typeof e.updatedAt === 'number'
}

function parse(raw: string | null): HistoryEntry[] {
  if (!raw) return []
  try {
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value.filter(isEntry) : []
  } catch {
    return []
  }
}

/** The saved list, newest first, or null when this browser won't let us read storage. */
export function loadHistory(): HistoryEntry[] | null {
  try {
    return parse(localStorage.getItem(HISTORY_KEY))
  } catch {
    return null
  }
}

/** Adds or updates an entry. Status never goes backwards (a solved problem stays solved). */
export function upsertHistory(entry: HistoryEntry): HistoryEntry[] {
  const current = loadHistory() ?? []
  const existing = current.find((e) => e.key === entry.key)
  const merged: HistoryEntry = existing
    ? {
        ...existing,
        ...entry,
        status: RANK[existing.status] > RANK[entry.status] ? existing.status : entry.status,
        hintsUsed: Math.max(existing.hintsUsed, entry.hintsUsed),
        hints: entry.hints.length >= existing.hints.length ? entry.hints : existing.hints,
      }
    : entry
  const list = [merged, ...current.filter((e) => e.key !== entry.key)]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_HISTORY)
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {
    // Storage full or blocked: keep working with the in-memory list.
  }
  return list
}

/** LeetCode problems are keyed by slug; pasted ones by a hash of their text. */
export function historyKey(problem: { slug?: string; statement: string }): string {
  if (problem.slug) return problem.slug
  let hash = 0x811c9dc5
  for (let i = 0; i < problem.statement.length; i++) {
    hash ^= problem.statement.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return 'custom:' + hash.toString(16).padStart(8, '0')
}

export function statusLine(e: HistoryEntry): string {
  switch (e.status) {
    case 'solved':
      return 'Solved'
    case 'solution':
      return 'Solution viewed'
    case 'explained':
      return 'Explained'
    case 'hints':
      return e.source === 'custom'
        ? `Pasted · ${e.hintsUsed} ${e.hintsUsed === 1 ? 'hint' : 'hints'}`
        : `Hint ${e.hintsUsed} of ${MAX_HINTS}`
    default:
      return 'Started'
  }
}
