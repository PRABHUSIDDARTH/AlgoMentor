import { useCallback, useState, useSyncExternalStore } from 'react'
import { getThemeChoice, setThemeChoice, THEME_EVENT, type ThemeChoice } from './theme'

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange)
  return () => window.removeEventListener(THEME_EVENT, onChange)
}

/** The theme actually on screen, for components that need it in JS (e.g. toasts, the nav blob). */
export function useResolvedTheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
    () => 'light',
  )
}

/** The current theme and a setter that saves it. */
export function useThemeChoice(): [ThemeChoice, (c: ThemeChoice) => void] {
  const [choice, setChoice] = useState<ThemeChoice>(getThemeChoice)
  const update = useCallback((c: ThemeChoice) => {
    setThemeChoice(c)
    setChoice(c)
  }, [])
  return [choice, update]
}
