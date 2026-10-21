import { Menu } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import GooeyNav from '@/components/bits/GooeyNav'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useResolvedTheme } from '@/lib/useTheme'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'top', label: 'Overview' },
  { id: 'how', label: 'How it works' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'faq', label: 'FAQ' },
]
const SECTION_IDS = SECTIONS.map((s) => s.id)
const ITEMS = SECTIONS.map((s) => ({ label: s.label, href: `#${s.id}` }))

// GooeyNav draws its blob on a canvas, so it needs literal colours rather than CSS variables.
const BLOB = { light: { pill: '#8B9A6E', ink: '#262C1E' }, dark: { pill: '#8B9A6E', ink: '#0E100B' } }

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const active = useActiveSection(SECTION_IDS)
  const theme = useResolvedTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('sticky top-0 z-40 border-b bg-cream/95 backdrop-blur-[2px] transition-[border-color]', scrolled ? 'border-line' : 'border-transparent')}>
      <div className="flex items-center gap-6 px-6 py-3 text-[13.5px] sm:px-10 lg:px-16 xl:px-24">
        <Logo />
        {/* GooeyNav sets its own display, so the responsive hiding lives on a wrapper. */}
        <div className="hidden md:block">
        <GooeyNav
          items={ITEMS}
          activeIndex={active}
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
        <div className="flex-1" />
        <Link to="/app" className="hidden py-1 text-ink/80 hover:text-ink sm:inline">Workspace</Link>
        <ThemeToggle />
        <Button asChild className="hidden bg-ink font-semibold text-cream hover:bg-ink/90 sm:inline-flex">
          <Link to="/app">Get started</Link>
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu" className="md:hidden">
              <Menu className="size-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-cream text-ink">
            <SheetTitle className="px-4 pt-4 font-display text-lg">AlgoMentor</SheetTitle>
            <div className="grid gap-1 px-4 pb-6 text-[15px]">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="rounded-md py-2">{s.label}</a>
              ))}
              <Link to="/app" className="rounded-md py-2">Workspace</Link>
              <Button asChild className="mt-3 bg-ink font-semibold text-cream hover:bg-ink/90">
                <Link to="/app">Get started</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
