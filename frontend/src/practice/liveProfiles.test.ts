import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, loadStats, saveSettings, saveStats } from './store'
import { LIVE_REFRESH_MS, staleSites, useLiveProfiles } from './liveProfiles'

const api = vi.hoisted(() => ({ fetchProfile: vi.fn() }))
vi.mock('@/lib/api', async (orig) => ({ ...(await orig<typeof import('@/lib/api')>()), ...api }))

const GH = { username: 'demo', publicRepos: 1, followers: 2, stars: 3, languages: [], lastPushAt: null }

beforeEach(() => api.fetchProfile.mockResolvedValue(GH))
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
  api.fetchProfile.mockReset()
})

describe('staleSites', () => {
  const settings = { ...DEFAULT_SETTINGS, leetcode: 'a', github: 'b' }

  it('listsConnectedSitesWithNoStatsOrOldStats', () => {
    const now = 1_000_000_000
    expect(staleSites(settings, {}, now)).toEqual(['leetcode', 'github'])
    expect(staleSites(settings, { leetcode: { data: {}, fetchedAt: now - 1000 }, github: { data: {}, fetchedAt: now - LIVE_REFRESH_MS - 1 } }, now)).toEqual(['github'])
  })

  it('ignoresSitesThatAreNotConnected', () => {
    expect(staleSites(DEFAULT_SETTINGS, {}, 0)).toEqual([])
  })
})

describe('useLiveProfiles', () => {
  it('refreshesStaleProfilesWhenThePageOpens', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, github: 'demo' })
    renderHook(() => useLiveProfiles())
    await vi.waitFor(() => expect(loadStats().github?.data).toEqual(GH))
    expect(api.fetchProfile).toHaveBeenCalledWith('github', 'demo', expect.anything(), { refresh: true })
  })

  it('refreshesAgainAfterTheIntervalWhileVisible', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    saveSettings({ ...DEFAULT_SETTINGS, github: 'demo' })
    saveStats('github', GH)
    renderHook(() => useLiveProfiles())
    expect(api.fetchProfile).not.toHaveBeenCalled()
    await act(async () => { vi.advanceTimersByTime(LIVE_REFRESH_MS + 61_000) })
    expect(api.fetchProfile).toHaveBeenCalledTimes(1)
  })

  it('refreshesWhenTheWindowRegainsFocusAndTheStatsAreOld', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, github: 'demo' })
    saveStats('github', GH)
    renderHook(() => useLiveProfiles())
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + LIVE_REFRESH_MS * 2)
    await act(async () => { window.dispatchEvent(new Event('focus')) })
    expect(api.fetchProfile).toHaveBeenCalledTimes(1)
  })
})
