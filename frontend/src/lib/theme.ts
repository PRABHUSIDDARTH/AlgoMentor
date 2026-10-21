export type ThemeChoice = 'light' | 'dark'

export const THEME_KEY = 'algomentor.theme'

/** Fired on window whenever the applied theme may have changed. */
export const THEME_EVENT = 'algomentor:theme'

export function prefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

/** The saved choice, or the system preference on a first visit (or after the old "system" option). */
export function getThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage blocked (private mode, disabled cookies): fall back to the system setting.
  }
  return prefersDark() ? 'dark' : 'light'
}

export function applyTheme(choice: ThemeChoice): void {
  document.documentElement.classList.toggle('dark', choice === 'dark')
  window.dispatchEvent(new Event(THEME_EVENT))
}

/** Remembers the choice when storage allows, and always applies it. */
export function setThemeChoice(choice: ThemeChoice): void {
  try {
    localStorage.setItem(THEME_KEY, choice)
  } catch {
    // Not persisted, but the page still switches.
  }
  applyTheme(choice)
}

export function nextThemeChoice(choice: ThemeChoice): ThemeChoice {
  return choice === 'light' ? 'dark' : 'light'
}
