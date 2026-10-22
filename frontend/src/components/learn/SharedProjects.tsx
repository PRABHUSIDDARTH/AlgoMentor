import { useEffect, useState } from 'react'
import { fetchSharedProjects, type SharedProject } from '@/lib/api'
import { ROLE_LABEL } from '@/content/targets'

/** Projects people shared after getting placed. Reviewed by AlgoMentor, not verified, shown as plain text. Hidden until there is one. */
export function SharedProjects() {
  const [items, setItems] = useState<SharedProject[]>([])
  useEffect(() => {
    const ac = new AbortController()
    fetchSharedProjects(ac.signal).then(setItems).catch(() => {})
    return () => ac.abort()
  }, [])
  if (!items.length) return null
  return (
    <section aria-labelledby="shared-title" className="grid gap-3">
      <div className="grid gap-1">
        <h2 id="shared-title" className="text-[18px] font-semibold">From people who got in</h2>
        <p className="max-w-[72ch] text-[13px] leading-relaxed text-ink-muted">Shared by users, reviewed by AlgoMentor, not verified. Use them as ideas, and check anything that matters.</p>
      </div>
      <ul className="grid gap-4 xl:grid-cols-2">
        {items.map((p) => (
          <li key={p.id} className="grid gap-2 rounded-lg border border-line bg-cream px-5 py-5">
            <h3 className="text-[17px] font-semibold leading-snug">{p.projectTitle}</h3>
            <p className="font-mono text-[11.5px] text-ink-muted">{p.company} · {p.roleTitle} · {ROLE_LABEL[p.level]}{p.year ? ` · ${p.year}` : ''}</p>
            <p className="max-w-[72ch] text-[13.5px] leading-relaxed">{p.summary}</p>
            <p className="max-w-[72ch] text-[13.5px] leading-relaxed"><span className="eyebrow mr-2">How it helped</span>{p.whyItHelped}</p>
            <p className="text-[12.5px] text-ink-muted">Stack: {p.stack}</p>
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-muted">
              {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noreferrer" className="underline underline-offset-[3px]">{p.repoUrl.replace(/^https:\/\//, '')}<span className="sr-only"> (opens in a new tab)</span></a>}
              {p.name && <span>{p.linkedin ? <a href={`https://www.linkedin.com/in/${p.linkedin}`} target="_blank" rel="noreferrer" className="underline underline-offset-[3px]">{p.name}<span className="sr-only"> on LinkedIn (opens in a new tab)</span></a> : p.name}</span>}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
