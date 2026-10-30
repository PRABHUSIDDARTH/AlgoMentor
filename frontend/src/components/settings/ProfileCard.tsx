import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ApiError, fetchProfile, type GfgProfile, type GitHubProfile, type HackerRankProfile, type LeetCodeProfile } from '@/lib/api'
import { syncFromLeetCode } from '@/practice/progress'
import { parseProfileUrl, SITE_NAMES, type Site } from '@/practice/profileUrls'
import { clearStats, saveStats, type StatsEntry } from '@/practice/store'

const PLACEHOLDER: Record<Site, string> = {
  leetcode: 'https://leetcode.com/u/yourname',
  hackerrank: 'https://www.hackerrank.com/profile/yourname',
  gfg: 'https://www.geeksforgeeks.org/user/yourname',
  github: 'https://github.com/yourname',
}
const FRESH_MS = 6 * 60 * 60 * 1000

/** One line of stats per site, as plain text joined with " · ". */
export function statsLine(site: Site, data: unknown): string[] {
  if (site === 'leetcode') {
    const p = data as LeetCodeProfile
    return [`${p.solved.total} solved · ${p.solved.easy} Easy · ${p.solved.medium} Medium · ${p.solved.hard} Hard`,
      ...(p.ranking ? [`Ranking ${p.ranking.toLocaleString('en-US')}`] : [])]
  }
  if (site === 'hackerrank') {
    const p = data as HackerRankProfile
    if (!p.badges.length) return ['No badges yet']
    return p.badges.slice(0, 4).map((b) => `${b.name} · ${b.stars} ${b.stars === 1 ? 'star' : 'stars'} · ${b.solved} solved`)
  }
  if (site === 'github') {
    const p = data as GitHubProfile
    const pushed = p.lastPushAt ? new Date(p.lastPushAt * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
    return [`${p.publicRepos} public repos · ${p.stars} ${p.stars === 1 ? 'star' : 'stars'} · ${p.followers} followers`,
      ...(p.languages.length ? [p.languages.join(' · ')] : []), ...(pushed ? [`Last push ${pushed}`] : [])]
  }
  const p = data as GfgProfile
  return [[`${p.solved} solved`, `score ${p.score}`, p.instituteRank ? `institute rank ${p.instituteRank}` : null, p.streak ? `${p.streak}-day streak` : null]
    .filter(Boolean).join(' · ')]
}

interface Props {
  site: Site
  username?: string
  stats?: StatsEntry
  onConnect: (username: string) => void
  onDisconnect: () => void
}

export function ProfileCard({ site, username, stats, onConnect, onDisconnect }: Props) {
  const name = SITE_NAMES[site]
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [synced, setSynced] = useState<string | null>(null)
  const inflight = useRef<AbortController | null>(null)
  useEffect(() => () => inflight.current?.abort(), [])

  async function load(user: string, refresh = false) {
    inflight.current?.abort()
    const ac = new AbortController()
    inflight.current = ac
    setBusy(true)
    setError(null)
    try {
      const data = refresh ? await fetchProfile(site, user, ac.signal, { refresh: true }) : await fetchProfile(site, user, ac.signal)
      if (ac.signal.aborted) return false
      saveStats(site, data)
      if (site === 'leetcode') {
        // Recent accepted problems that are on the roadmap count as solved there too.
        const n = syncFromLeetCode((data as LeetCodeProfile).recent)
        setSynced(n ? `${n} recent ${n === 1 ? 'solve' : 'solves'} added to your roadmap` : null)
      }
      return true
    } catch (e) {
      if (ac.signal.aborted) return false
      setError(e instanceof ApiError ? e.message : `Couldn't reach AlgoMentor to read ${name}.`)
      return false
    } finally {
      if (!ac.signal.aborted) setBusy(false)
    }
  }

  async function connect(e: FormEvent) {
    e.preventDefault()
    const parsed = parseProfileUrl(site, url)
    if ('error' in parsed) return setError(parsed.error)
    if (await load(parsed.username)) {
      onConnect(parsed.username)
      setUrl('')
    }
  }

  const stale = !stats || Date.now() - stats.fetchedAt > FRESH_MS
  return (
    <section aria-label={name} className="grid gap-2.5 rounded-lg border border-line bg-cream px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-mono text-[13px] font-semibold">{name}</h3>
        {username && <span className="truncate font-mono text-[11.5px] text-ink-muted">@{username}</span>}
      </div>
      {username ? (
        <>
          {stats ? (
            <div className="grid gap-0.5 text-[12.5px]">
              {statsLine(site, stats.data).map((l) => <p key={l}>{l}</p>)}
              {stale && <p className="text-[11.5px] text-ink-muted">Last read over 6 hours ago.</p>}
            </div>
          ) : (
            <p className="text-[12.5px] text-ink-muted">{busy ? 'Reading profile…' : 'No stats loaded yet.'}</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-ink bg-transparent" disabled={busy} aria-label={`Refresh ${name}`} onClick={() => load(username, true)}>
              Refresh
            </Button>
            <Button size="sm" variant="ghost" aria-label={`Disconnect ${name}`} onClick={() => { clearStats(site); onDisconnect() }}>
              Disconnect
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={connect} className="flex gap-2">
          <input
            aria-label={`${name} profile URL`}
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null) }}
            placeholder={PLACEHOLDER[site]}
            className="min-w-0 flex-1 rounded-md border border-line-strong bg-grey px-2.5 py-1.5 text-[12.5px] placeholder:text-ink-muted"
          />
          <Button type="submit" size="sm" className="bg-ink text-cream hover:bg-ink/90" disabled={busy || !url.trim()} aria-label={`Connect ${name}`}>
            {busy ? 'Connecting…' : 'Connect'}
          </Button>
        </form>
      )}
      {synced && <p role="status" className="text-[12px] text-ink-muted">{synced}</p>}
      {error && <p role="alert" className="text-[12px] text-danger">{error}</p>}
    </section>
  )
}
