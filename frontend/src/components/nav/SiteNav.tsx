import { Menu, Search } from 'lucide-react'
import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import GooeyNav, { type GooeyNavItem } from '@/components/bits/GooeyNav'
import { Logo } from '@/components/Logo'
import { SettingsButton } from '@/components/settings/SettingsButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useResolvedTheme } from '@/lib/useTheme'
import { cn } from '@/lib/utils'
import { SECTIONS, sectionFor } from '@/nav/sections'
import { MobileMenu } from './MobileMenu'
import { SectionTabs } from './SectionTabs'

interface Props {
  /** The landing page: in-page links instead of app sections, plus a Get started button. */
  landing?: boolean
  /** Workspace only: opens "Jump to problem". */
  onJump?: () => void
  /** Workspace only: opens the recent-problems drawer on narrow screens. */
  onMenu?: () => void
}

const LANDING_LINKS = [
  { id: 'top', label: 'Overview' },
  { id: 'how', label: 'How it works' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'faq', label: 'FAQ' },
]
const LANDING_IDS = LANDING_LINKS.map((l) => l.id)
const LANDING_ITEMS: GooeyNavItem[] = LANDING_LINKS.map((l) => ({ label: l.label, href: `#${l.id}` }))
const PAGE_LINKS = LANDING_LINKS.map((l) => ({ label: l.label, href: `#${l.id}` }))
const SECTION_ITEMS: GooeyNavItem[] = SECTIONS.map((s) => ({ label: s.label, href: s.to }))

// GooeyNav draws its blob on a canvas, so it needs literal colours rather than CSS variables.
const BLOB = { light: { pill: '#8B9A6E', ink: '#262C1E' }, dark: { pill: '#8B9A6E', ink: '#0E100B' } }

function Gooey({ items, activeIndex, label, onItemClick }: { items: GooeyNavItem[]; activeIndex: number; label: string; onItemClick?: (item: GooeyNavItem, e: MouseEvent) => void }) {
  const theme = useResolvedTheme()
  // GooeyNav sets its own display, so the responsive hiding lives on a wrapper.
  return (
    <div className="hidden md:block">
      <GooeyNav
        aria-label={label}
        items={items}
        activeIndex={activeIndex}
        onItemClick={onItemClick}
        theme={theme}
        color={BLOB[theme].pill}
        activeTextColor={BLOB[theme].ink}
        colors={['#8B9A6E', '#A8B68A', '#56613F']}
        frame={false}
        size="sm"
        particleCount={10}
        style={{ '--gn-ink': 'var(--ink)', '--gn-muted': 'var(--ink-muted)' } as CSSProperties}
      />
    </div>
  )
}

function SectionLinks() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const index = Math.max(0, SECTIONS.findIndex((s) => s.id === sectionFor(pathname)))
  return (
    <Gooey
      label="Sections"
      items={SECTION_ITEMS}
      activeIndex={index}
      onItemClick={(item, e) => { e.preventDefault(); if (item.href) navigate(item.href) }}
    />
  )
}

function LandingLinks() {
  return <Gooey label="Page" items={LANDING_ITEMS} activeIndex={useActiveSection(LANDING_IDS)} />
}

/** The navbar for every page: logo, sections (GooeyNav), search, theme and settings, with the section's pages beneath. */
export function SiteNav({ landing = false, onJump, onMenu }: Props) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    if (!landing) return
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [landing])

  return (
    <header className={cn('z-40 border-b bg-cream/95 backdrop-blur-[2px] transition-[border-color]', landing && 'sticky top-0', landing && !scrolled ? 'border-transparent' : 'border-line')}>
      <div className="flex items-center gap-3 py-2.5 pr-16 pl-4 text-[13.5px] sm:gap-5 sm:pl-6 lg:pl-10 xl:pl-14">
        {onMenu && (
          <Button variant="ghost" size="icon" aria-label="Recent problems" onClick={onMenu} className="min-[1200px]:hidden">
            <Menu className="size-4" aria-hidden="true" />
          </Button>
        )}
        <Logo />
        {landing ? <LandingLinks /> : <SectionLinks />}
        <span className="flex-1" />
        {onJump && (
          <button
            type="button"
            onClick={onJump}
            className="hidden w-[230px] items-center justify-between rounded-md border border-line-strong px-2.5 py-1.5 text-ink-muted hover:border-ink hover:text-ink sm:flex"
          >
            <span className="inline-flex items-center gap-2"><Search className="size-3.5" aria-hidden="true" />Jump to problem</span>
            <kbd className="rounded border border-line-strong px-1.5 font-mono text-[10.5px]">Ctrl K</kbd>
          </button>
        )}
        {onJump && (
          <Button variant="ghost" size="icon" aria-label="Jump to problem" onClick={onJump} className="sm:hidden">
            <Search className="size-4" aria-hidden="true" />
          </Button>
        )}
        {landing && (
          <Button asChild className="hidden bg-ink font-semibold text-cream hover:bg-ink/90 sm:inline-flex">
            <Link to="/app">Get started</Link>
          </Button>
        )}
        <ThemeToggle />
        <MobileMenu pageLinks={landing ? PAGE_LINKS : undefined} />
        {/* Fixed top-right on screen; placed last so it follows the nav in keyboard order. */}
        <SettingsButton />
      </div>
      {!landing && <SectionTabs />}
    </header>
  )
}
