import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockMatchMedia } from '../../vitest.setup'
import { getThemeChoice, nextThemeChoice, setThemeChoice, THEME_KEY } from './theme'

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.classList.remove('dark')
  localStorage.clear()
})

describe('theme (light and dark only)', () => {
  it('flips between light and dark', () => {
    expect(nextThemeChoice('light')).toBe('dark')
    expect(nextThemeChoice('dark')).toBe('light')
  })

  it('falls back to the system preference when nothing is saved', () => {
    mockMatchMedia((q) => q.includes('dark'))
    expect(getThemeChoice()).toBe('dark')
    mockMatchMedia(() => false)
    expect(getThemeChoice()).toBe('light')
  })

  it('treats a saved "system" value from the old three-way toggle as unsaved', () => {
    localStorage.setItem(THEME_KEY, 'system')
    mockMatchMedia(() => false)
    expect(getThemeChoice()).toBe('light')
  })

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
