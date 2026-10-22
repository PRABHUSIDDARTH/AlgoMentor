import { Menu, Search } from 'lucide-react'
import { NavLink } from 'react-router'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'

interface Props {
  onJump?: () => void
  onMenu?: () => void
}

const LINKS = [
  { to: '/app', label: 'Practice' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/today', label: 'Today' },
  { to: '/learn', label: 'Learn' },
]

export function AppNav({ onJump, onMenu }: Props) {
  return (
    <header className="bg-band text-on-band">
      <nav aria-label="App" className="flex items-center gap-2 py-2.5 pr-16 pl-3 text-[12.5px] sm:gap-5 sm:pl-5">
        {onMenu && (
          <Button variant="ghost" size="icon" aria-label="Recent problems" onClick={onMenu} className="text-on-band hover:bg-on-band/10 hover:text-on-band min-[1200px]:hidden">
            <Menu className="size-4" aria-hidden="true" />
          </Button>
        )}
        <Logo className="text-[17px]" onBand />
        <div className="hidden items-center gap-5 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'pb-[3px] shadow-[0_2px_0_var(--sage)]' : 'pb-[3px] opacity-75 hover:opacity-100')}>
              {l.label}
            </NavLink>
          ))}
        </div>
        <span className="flex-1" />
        {onJump && <button
          type="button"
          onClick={onJump}
          className="hidden w-[230px] items-center justify-between rounded-md border border-on-band/25 px-2.5 py-1.5 text-on-band/85 hover:border-on-band/50 sm:flex"
        >
          <span className="inline-flex items-center gap-2"><Search className="size-3.5" aria-hidden="true" />Jump to problem</span>
          <kbd className="rounded border border-on-band/30 px-1.5 font-mono text-[10.5px]">Ctrl K</kbd>
        </button>}
        {onJump && <Button variant="ghost" size="icon" aria-label="Jump to problem" onClick={onJump} className="text-on-band hover:bg-on-band/10 hover:text-on-band sm:hidden">
          <Search className="size-4" aria-hidden="true" />
        </Button>}
        <ThemeToggle className="text-on-band hover:text-on-band" />
      </nav>
    </header>
  )
}
