import { createContext, useContext, useEffect, useRef } from 'react'

export interface NavActions {
  onJump?: () => void
  onMenu?: () => void
}

interface Host {
  /** Registers the page's navbar actions (Workspace only) and returns a function that removes them. */
  register: (actions: NavActions) => () => void
}

export const NavHostContext = createContext<Host | null>(null)

/** The persistent navbar's host, or null when a page is rendered on its own (tests, embedding). */
export const useNavHost = () => useContext(NavHostContext)

/** Hands the page's navbar actions to the persistent navbar. Does nothing when the page renders its own. */
export function useNavActions(actions: NavActions) {
  const host = useNavHost()
  const latest = useRef(actions)
  latest.current = actions
  const hasJump = !!actions.onJump
  const hasMenu = !!actions.onMenu
  useEffect(() => {
    if (!host) return
    return host.register({
      onJump: hasJump ? () => latest.current.onJump?.() : undefined,
      onMenu: hasMenu ? () => latest.current.onMenu?.() : undefined,
    })
  }, [host, hasJump, hasMenu])
}
