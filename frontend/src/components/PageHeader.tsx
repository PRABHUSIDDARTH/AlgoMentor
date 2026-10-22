import type { ReactNode } from 'react'
import { Link } from 'react-router'

export interface Crumb { label: string; to?: string }

/** The head of every page: breadcrumbs, eyebrow, title, summary, then any extra lines. */
export function PageHeader({ eyebrow, title, summary, crumbs, children }: { eyebrow?: ReactNode; title: ReactNode; summary?: ReactNode; crumbs?: Crumb[]; children?: ReactNode }) {
  return (
    <header className="grid gap-2">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-ink-muted">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">/</span>}
                {c.to ? <Link to={c.to} className="hover:text-ink hover:underline">{c.label}</Link> : <span aria-current="page" className="text-ink">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="display text-[32px] leading-tight xl:text-[38px]">{title}</h1>
      {summary && <p className="max-w-[72ch] text-[14px] leading-relaxed text-ink-muted">{summary}</p>}
      {children}
    </header>
  )
}
