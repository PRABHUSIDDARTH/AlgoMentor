import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#integrations', label: 'Integrations' },
  { href: '#faq', label: 'FAQ' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('sticky top-0 z-40 bg-cream/95 backdrop-blur-[2px] transition-[border-color]', 'border-b', scrolled ? 'border-line' : 'border-transparent')}>
      <nav aria-label="Main" className="mx-auto flex max-w-[1180px] items-center gap-7 px-5 py-4 text-[13.5px] sm:px-8">
        <Logo />
        <div className="hidden items-center gap-7 md:flex">
          <Link to="/app" className="py-1 text-ink/80 hover:text-ink">Workspace</Link>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="py-1 text-ink/80 hover:text-ink">{l.label}</a>
          ))}
        </div>
        <div className="flex-1" />
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
              <Link to="/app" className="rounded-md py-2">Workspace</Link>
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} className="rounded-md py-2">{l.label}</a>
              ))}
              <Button asChild className="mt-3 bg-ink font-semibold text-cream hover:bg-ink/90">
                <Link to="/app">Get started</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
