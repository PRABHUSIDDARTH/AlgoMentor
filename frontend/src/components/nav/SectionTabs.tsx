import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { SECTIONS, sectionFor, sectionTabs, tabFor } from '@/nav/sections'

/** The second navbar row: the pages of the current section. Hidden on small screens, where the menu lists them. */
export function SectionTabs() {
  const { pathname } = useLocation()
  const id = sectionFor(pathname)
  if (!id) return null
  const section = SECTIONS.find((s) => s.id === id)!
  const current = tabFor(pathname)
  return (
    <nav aria-label={`${section.label} pages`} className="hidden gap-x-6 overflow-x-auto border-t border-line px-4 text-[13px] md:flex sm:px-6 lg:px-10 xl:px-14">
      {sectionTabs(id).map((t) => {
        const active = t.to === current?.to
        return (
          <Link
            key={t.to}
            to={t.to}
            aria-current={active ? 'page' : undefined}
            className={cn('whitespace-nowrap py-2.5', active ? 'font-semibold shadow-[inset_0_-2px_0_var(--sage)]' : 'text-ink-muted hover:text-ink')}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
