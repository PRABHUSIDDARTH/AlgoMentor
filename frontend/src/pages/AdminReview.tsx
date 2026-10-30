import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { ROLE_LABEL } from '@/content/targets'
import { ApiError, decideContribution, fetchPendingContributions, type PendingContribution } from '@/lib/api'

const KEY = 'algomentor.admin'
const read = () => { try { return sessionStorage.getItem(KEY) ?? '' } catch { return '' } }

/** Where people shared "the project that got me in" are approved or rejected. Needs the server's admin token. */
export default function AdminReview() {
  const [token, setToken] = useState('')
  const [items, setItems] = useState<PendingContribution[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])
  useEffect(() => { setToken(read()) }, [])

  const signal = () => (abort.current ??= new AbortController()).signal
  const fail = (e: unknown) => setError(e instanceof ApiError ? e.message : "Couldn't reach AlgoMentor. Try again.")

  async function load(e?: FormEvent) {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    try {
      setItems(await fetchPendingContributions(token.trim(), signal()))
      try { sessionStorage.setItem(KEY, token.trim()) } catch { /* the token is only a convenience for this tab */ }
    } catch (err) {
      setItems(null)
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  async function decide(id: string, decision: 'approve' | 'reject') {
    setError(null)
    try {
      await decideContribution(token.trim(), id, decision, signal())
      setItems((list) => list?.filter((c) => c.id !== id) ?? null)
    } catch (err) {
      fail(err)
    }
  }

  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-7 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader eyebrow="Review" title="Shared projects" summary="Entries wait here until you approve them. Only approved entries are public, and the email is for you alone." />
        <form onSubmit={load} className="flex max-w-[560px] flex-wrap items-end gap-3">
          <label className="grid flex-1 gap-1 text-[12px] text-ink-muted">
            Admin token
            <input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} className="rounded-md border border-line-strong bg-grey px-2.5 py-1.5 text-[13px] text-ink" />
          </label>
          <Button type="submit" disabled={busy || !token.trim()} className="bg-ink text-cream hover:bg-ink/90">Load pending</Button>
        </form>
        {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
        {items && items.length === 0 && <p className="text-[13.5px] text-ink-muted">Nothing waiting for review.</p>}
        {items && items.length > 0 && (
          <ul className="grid gap-4 xl:grid-cols-2">
            {items.map((c) => (
              <li key={c.id}>
                <article aria-label={c.projectTitle} className="grid gap-2 rounded-lg border border-line bg-cream px-5 py-5">
                  <h2 className="text-[17px] font-semibold">{c.projectTitle}</h2>
                  <p className="font-mono text-[11.5px] text-ink-muted">{c.company} · {c.roleTitle} · {ROLE_LABEL[c.level]}{c.year ? ` · ${c.year}` : ''}</p>
                  <p className="text-[13.5px] leading-relaxed">{c.summary}</p>
                  <p className="text-[13.5px] leading-relaxed"><span className="eyebrow mr-2">How it helped</span>{c.whyItHelped}</p>
                  <p className="text-[12.5px] text-ink-muted">Stack: {c.stack}{c.repoUrl ? ` · ${c.repoUrl}` : ''}</p>
                  <p className="text-[12.5px] text-ink-muted">From {c.name ?? 'anonymous'}{c.linkedin ? ` (linkedin.com/in/${c.linkedin})` : ''}{c.email ? ` · ${c.email}` : ''}</p>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="bg-sage font-semibold text-on-sage hover:bg-sage/90" onClick={() => void decide(c.id, 'approve')}>Approve</Button>
                    <Button size="sm" variant="outline" className="border-ink bg-transparent" onClick={() => void decide(c.id, 'reject')}>Reject</Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
