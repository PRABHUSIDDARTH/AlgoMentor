import { Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SECTIONS, sectionTabs, tabFor } from '@/nav/sections'

export interface PageLink { label: string; href: string }

/** Small-screen menu: every section with its pages (or, on the landing page, its in-page links). */
export function MobileMenu({ pageLinks }: { pageLinks?: PageLink[] }) {
  const current = tabFor(useLocation().pathname)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu" className="md:hidden">
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto bg-cream text-ink">
        <SheetTitle className="px-4 pt-4 font-display text-lg">AlgoMentor</SheetTitle>
        <div className="grid gap-5 px-4 pb-6 text-[15px]">
          {pageLinks && (
            <div className="grid gap-1">
              {pageLinks.map((l) => (
                <SheetClose asChild key={l.href}><a href={l.href} className="rounded-md py-1.5">{l.label}</a></SheetClose>
              ))}
            </div>
          )}
          {SECTIONS.map((s) => (
            <div key={s.id} className="grid gap-1">
              <p className="eyebrow">{s.label}</p>
              {sectionTabs(s.id).map((t) => (
                <SheetClose asChild key={t.to}>
                  <Link to={t.to} aria-current={t.to === current?.to ? 'page' : undefined} className="rounded-md py-1.5 aria-[current=page]:font-semibold">{t.label}</Link>
                </SheetClose>
              ))}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
