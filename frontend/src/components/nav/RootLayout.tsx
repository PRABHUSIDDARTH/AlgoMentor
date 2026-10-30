import { Suspense, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { NavHostContext, type NavActions } from './NavHost'
import { SiteNav } from './SiteNav'

/**
 * Owns the navbar for every route, so it stays mounted while pages change underneath it.
 * That is what lets the GooeyNav blob and particles travel from one item to the next across pages.
 */
export function RootLayout() {
  const { pathname } = useLocation()
  const landing = pathname === '/'
  const [actions, setActions] = useState<NavActions>({})
  const host = useMemo(() => ({
    register: (a: NavActions) => {
      setActions(a)
      return () => setActions((current) => (current === a ? {} : current))
    },
  }), [])

  return (
    <NavHostContext.Provider value={host}>
      <div
        data-testid={pathname === '/app' || pathname.startsWith('/app/') ? 'workspace-shell' : undefined}
        className={cn('flex min-h-dvh flex-col bg-cream', !landing && 'md:h-dvh md:overflow-hidden')}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-cream">
          Skip to content
        </a>
        <SiteNav landing={landing} onJump={actions.onJump} onMenu={actions.onMenu} />
        <Suspense fallback={<main id="main" className="min-h-0 flex-1" />}>
          <Outlet />
        </Suspense>
      </div>
    </NavHostContext.Provider>
  )
}
