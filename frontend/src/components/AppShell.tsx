import type { ReactNode } from 'react'
import { useNavActions, useNavHost } from '@/components/nav/NavHost'
import { SiteNav } from '@/components/nav/SiteNav'

/** Full-height app layout shared by the Practice hub pages; the content area scrolls on its own on desktop. The navbar comes from RootLayout when there is one. */
export function AppShell({ children, onJump, onMenu }: { children: ReactNode; onJump?: () => void; onMenu?: () => void }) {
  const host = useNavHost()
  useNavActions({ onJump, onMenu })
  const main = <main id="main" className="min-h-0 flex-1 md:overflow-y-auto">{children}</main>
  if (host) return main
  return (
    <div className="flex min-h-dvh flex-col bg-cream md:h-dvh md:overflow-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      <SiteNav onJump={onJump} onMenu={onMenu} />
      {main}
    </div>
  )
}
