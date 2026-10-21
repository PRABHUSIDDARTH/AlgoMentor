import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { applyTheme, getThemeChoice, setThemeChoice, THEME_EVENT, type ThemeChoice } from './theme'

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange)
  return () => window.removeEventListener(THEME_EVENT, onChange)
}

/** The theme actually on screen, for components that need it in JS (e.g. toasts). */
export function useResolvedTheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
    () => 'light',
  )
}

/** The user's choice (light, dark or system), kept in sync with the OS setting when on "system". */
export function useThemeChoice(): [ThemeChoice, (c: ThemeChoice) => void] {
  const [choice, setChoice] = useState<ThemeChoice>(getThemeChoice)

  useEffect(() => {
    if (choice !== 'system' || typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [choice])

  const update = useCallback((c: ThemeChoice) => {
    setThemeChoice(c)
    setChoice(c)
  }, [])

  return [choice, update]
}
