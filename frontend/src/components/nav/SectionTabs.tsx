import { useLocation, useNavigate } from 'react-router'
import { SECTIONS, sectionFor, sectionTabs, tabFor } from '@/nav/sections'
import { Gooey } from './Gooey'

/** The second navbar row: the pages of the current section, also a GooeyNav. Scrolls sideways inside itself on small screens. */
export function SectionTabs() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const id = sectionFor(pathname)
  if (!id) return null
  const section = SECTIONS.find((s) => s.id === id)!
  const tabs = sectionTabs(id)
  const current = tabFor(pathname)
  return (
    <div className="overflow-x-auto border-t border-line px-2 py-1.5 min-[420px]:px-4 sm:px-6 lg:px-10 xl:px-14">
      <Gooey
        label={`${section.label} pages`}
        items={tabs.map((t) => ({ label: t.label, href: t.to }))}
        activeIndex={Math.max(0, tabs.findIndex((t) => t.to === current?.to))}
        size="sm"
        particleCount={10}
        onItemClick={(item, e) => { e.preventDefault(); if (item.href) navigate(item.href) }}
      />
    </div>
  )
}
