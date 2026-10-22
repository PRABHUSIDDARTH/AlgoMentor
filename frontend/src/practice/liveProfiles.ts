import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchProfile, type LeetCodeProfile } from '@/lib/api'
import type { Site } from './profileUrls'
import { syncFromLeetCode } from './progress'
import { loadSettings, loadStats, saveStats, type ProfileSettings, type StatsEntry } from './store'

/** How old stats may get while the About page is open before they are read again. */
export const LIVE_REFRESH_MS = 10 * 60 * 1000

/** How often to look for stale stats; reads still happen at most once per LIVE_REFRESH_MS per site. */
const CHECK_MS = 60 * 1000

const SITES: Site[] = ['leetcode', 'hackerrank', 'gfg', 'github']

/** Connected sites whose stats are missing or older than LIVE_REFRESH_MS. */
export function staleSites(settings: ProfileSettings, stats: Partial<Record<Site, StatsEntry>>, now: number): Site[] {
  return SITES.filter((s) => settings[s] && (!stats[s] || now - stats[s]!.fetchedAt > LIVE_REFRESH_MS))
}

/**
 * Keeps connected profiles current while the page using it is open: on open, when the window regains focus, and every
 * LIVE_REFRESH_MS while the tab is visible. Only stale sites are read, so the profile sites see at most one read per site
 * every ten minutes. Returns the sites being read and a function to read everything now.
 */
export function useLiveProfiles(): { refreshing: Site[]; refreshAll: () => void } {
  const [refreshing, setRefreshing] = useState<Site[]>([])
  const busy = useRef(new Set<Site>())
  const abort = useRef<AbortController | null>(null)

  const read = useCallback(async (sites: Site[]) => {
    const settings = loadSettings()
    abort.current ??= new AbortController()
    const { signal } = abort.current
    const todo = sites.filter((s) => settings[s] && !busy.current.has(s))
    if (!todo.length) return
    todo.forEach((s) => busy.current.add(s))
    setRefreshing([...busy.current])
    await Promise.all(todo.map(async (site) => {
      try {
        const data = await fetchProfile(site, settings[site]!, signal, { refresh: true })
        if (signal.aborted) return
        saveStats(site, data)
        if (site === 'leetcode') syncFromLeetCode((data as LeetCodeProfile).recent)
      } catch {
        // A failed read keeps the last stats; the profile card shows its own errors when used directly.
      } finally {
        busy.current.delete(site)
      }
    }))
    if (!signal.aborted) setRefreshing([...busy.current])
  }, [])

  const readStale = useCallback(() => {
    if (document.visibilityState === 'hidden') return
    void read(staleSites(loadSettings(), loadStats(), Date.now()))
  }, [read])

  useEffect(() => {
    readStale()
    const timer = window.setInterval(readStale, CHECK_MS)
    window.addEventListener('focus', readStale)
    document.addEventListener('visibilitychange', readStale)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', readStale)
      document.removeEventListener('visibilitychange', readStale)
      abort.current?.abort()
    }
  }, [readStale])

  return { refreshing, refreshAll: () => void read(SITES) }
}
