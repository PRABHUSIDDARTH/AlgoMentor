import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ApiError, submitContribution, type ContributionInput } from '@/lib/api'
import { ROLE_LABEL } from '@/content/targets'
import { ROLES } from '@/practice/store'
import { useSettings } from '@/practice/useSettings'

const FIELD = 'rounded-md border border-line-strong bg-grey px-2.5 py-1.5 text-[13px] text-ink placeholder:text-ink-muted'
const LABEL = 'grid gap-1 text-[12px] text-ink-muted'
const TITLE = 'Share the project that got you in'

function Form({ onDone }: { onDone: () => void }) {
  const [settings] = useSettings()
  const [v, setV] = useState({
    company: '', roleTitle: '', projectTitle: '', summary: '', whyItHelped: '', stack: '', repoUrl: '', year: '',
    name: settings.name ?? '', linkedin: settings.linkedin ?? '', email: settings.email ?? '',
  })
  const [level, setLevel] = useState<ContributionInput['level']>(settings.target.role)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }))

  async function send(e: FormEvent) {
    e.preventDefault()
    if (!v.company.trim() || !v.roleTitle.trim() || !v.projectTitle.trim() || !v.summary.trim() || !v.whyItHelped.trim() || !v.stack.trim()) {
      return setError('Fill in the company, role, project name, what you built, how it helped and the stack.')
    }
    if (!consent) return setError('Please agree that the details you add may be shown publicly after review.')
    setError(null)
    setBusy(true)
    abort.current = new AbortController()
    const form = e.currentTarget as HTMLFormElement
    try {
      await submitContribution({
        company: v.company.trim(), level, roleTitle: v.roleTitle.trim(), projectTitle: v.projectTitle.trim(), summary: v.summary.trim(),
        whyItHelped: v.whyItHelped.trim(), stack: v.stack.trim(), repoUrl: v.repoUrl.trim() || undefined, name: v.name.trim() || undefined,
        linkedin: v.linkedin.trim() || undefined, email: v.email.trim() || undefined, year: v.year ? Number(v.year) : undefined,
        consent, website: (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '',
      }, abort.current.signal)
      setSent(true)
    } catch (err) {
      if (!abort.current.signal.aborted) setError(err instanceof ApiError ? err.message : "Couldn't reach AlgoMentor to send this. Try again.")
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="grid gap-3">
        <p role="status" className="text-[14px] leading-relaxed">Thank you. Your project is in the review queue. If it is approved it appears on the Resume projects page for others to learn from; you will not get an email either way.</p>
        <Button className="justify-self-start bg-ink text-cream hover:bg-ink/90" onClick={onDone}>Close</Button>
      </div>
    )
  }

  return (
    <form onSubmit={send} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={LABEL}>Company<input value={v.company} onChange={set('company')} maxLength={80} className={FIELD} placeholder="Where you got in" /></label>
        <label className={LABEL}>Role title<input value={v.roleTitle} onChange={set('roleTitle')} maxLength={80} className={FIELD} placeholder="Software Engineer, Backend" /></label>
        <label className={LABEL}>Level
          <select value={level} onChange={(e) => setLevel(e.target.value as ContributionInput['level'])} className={FIELD}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </label>
        <label className={LABEL}>Year you joined (optional)<input inputMode="numeric" value={v.year} onChange={set('year')} maxLength={4} className={FIELD} placeholder="2026" /></label>
      </div>
      <label className={LABEL}>Project name<input value={v.projectTitle} onChange={set('projectTitle')} maxLength={100} className={FIELD} /></label>
      <label className={LABEL}>What you built<textarea value={v.summary} onChange={set('summary')} maxLength={1200} rows={3} className={FIELD} placeholder="What it does, how it works, what was hard." /></label>
      <label className={LABEL}>How it helped you get in<textarea value={v.whyItHelped} onChange={set('whyItHelped')} maxLength={1200} rows={3} className={FIELD} placeholder="Which round or question it came up in, and what you said about it." /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={LABEL}>Stack<input value={v.stack} onChange={set('stack')} maxLength={200} className={FIELD} placeholder="Spring Boot, PostgreSQL" /></label>
        <label className={LABEL}>Repository link (optional)<input value={v.repoUrl} onChange={set('repoUrl')} maxLength={200} className={FIELD} placeholder="https://github.com/you/project" /></label>
        <label className={LABEL}>Your name (shown if approved)<input value={v.name} onChange={set('name')} maxLength={60} className={FIELD} /></label>
        <label className={LABEL}>LinkedIn profile name (shown if approved)<input value={v.linkedin} onChange={set('linkedin')} maxLength={100} className={FIELD} placeholder="ana-gomez" /></label>
      </div>
      <label className={LABEL}>Email (never shown)<input value={v.email} onChange={set('email')} maxLength={254} className={FIELD} placeholder="Only so a reviewer can ask a question" /></label>
      {/* A honeypot: people never see or fill this, bots do. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <label className="flex items-start gap-2 text-[12.5px] leading-relaxed">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        <span>I agree that the project details, and the name and LinkedIn name if I added them, may be shown publicly after review.</span>
      </label>
      {error && <p role="alert" className="text-[12.5px] text-danger">{error}</p>}
      <Button type="submit" disabled={busy} className="justify-self-start bg-sage font-semibold text-on-sage hover:bg-sage/90">{busy ? 'Sending…' : 'Send for review'}</Button>
    </form>
  )
}

/** "I got in": share the project that helped, for review. */
export function ContributeDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-ink bg-transparent">{TITLE}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto bg-cream sm:max-w-[640px]">
        <DialogTitle className="font-display text-[22px] font-medium">{TITLE}</DialogTitle>
        <DialogDescription className="text-[13px] leading-relaxed text-ink-muted">
          Got placed at your dream company? Tell us which project helped. Every entry is reviewed before anything is published, and what you write is shown as shared by users and not verified by AlgoMentor.
        </DialogDescription>
        <Form onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
