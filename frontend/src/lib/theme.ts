export type ThemeChoice = 'light' | 'dark' | 'system'

export const THEME_KEY = 'algomentor.theme'

/** Fired on window whenever the applied theme may have changed. */
export const THEME_EVENT = 'algomentor:theme'

const CHOICES: readonly ThemeChoice[] = ['light', 'dark', 'system']

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): 'light' | 'dark' {
  if (choice === 'system') return prefersDark ? 'dark' : 'light'
  return choice
}

export function getThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored && (CHOICES as readonly string[]).includes(stored)) return stored as ThemeChoice
  } catch {
    // Storage blocked (private mode, disabled cookies): fall back to the system setting.
  }
  return 'system'
}

export function prefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(choice: ThemeChoice): void {
  const dark = resolveTheme(choice, prefersDark()) === 'dark'
  document.documentElement.classList.toggle('dark', dark)
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
  return CHOICES[(CHOICES.indexOf(choice) + 1) % CHOICES.length]
}
