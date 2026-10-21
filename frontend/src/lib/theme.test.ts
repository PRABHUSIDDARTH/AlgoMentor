import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveTheme, setThemeChoice, THEME_KEY } from './theme'

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.classList.remove('dark')
  localStorage.clear()
})

describe('resolveTheme', () => {
  it('follows the system preference for "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('lets an explicit choice win over the system preference', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('setThemeChoice', () => {
  it('applies the dark class and remembers the choice', () => {
    setThemeChoice('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('still applies the theme when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => setThemeChoice('dark')).not.toThrow()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
