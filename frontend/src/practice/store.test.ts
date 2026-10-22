import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, loadSettings, loadStats, saveSettings, saveStats, SETTINGS_EVENT, SETTINGS_KEY } from './store'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('settings store', () => {
  it('defaultsWhenEmpty', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    expect(DEFAULT_SETTINGS).toEqual({ target: { company: 'faang', role: 'sde1' }, dailyGoal: 3 })
  })

  it('roundTrips', () => {
    saveSettings({ leetcode: 'lee215', target: { company: 'service', role: 'intern' }, dailyGoal: 5 })
    expect(loadSettings()).toEqual({ leetcode: 'lee215', target: { company: 'service', role: 'intern' }, dailyGoal: 5 })
  })

  it('rejectsInvalidStoredSettings', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ dailyGoal: 7, target: { company: 'nasa', role: 'sde1' }, leetcode: 'a b' }))
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem(SETTINGS_KEY, '{oops')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('saveEmitsSettingsEvent', () => {
    const listener = vi.fn()
    window.addEventListener(SETTINGS_EVENT, listener)
    saveSettings(DEFAULT_SETTINGS)
    window.removeEventListener(SETTINGS_EVENT, listener)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('dropsMalformedStats', () => {
    localStorage.setItem('algomentor.stats.v1', JSON.stringify({
      leetcode: { data: {}, fetchedAt: 1 },
      hackerrank: { data: { username: 'x', badges: 'nope' }, fetchedAt: 1 },
      gfg: { data: { username: 'x', solved: 3, score: 4, instituteRank: null, streak: null }, fetchedAt: 1 },
    }))
    expect(Object.keys(loadStats())).toEqual(['gfg'])
  })

  it('statsCarryFetchTime', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    saveStats('gfg', { username: 'x', solved: 1, score: 2, instituteRank: null, streak: null })
    expect(loadStats().gfg).toEqual({ data: { username: 'x', solved: 1, score: 2, instituteRank: null, streak: null }, fetchedAt: 1000 })
  })
})
