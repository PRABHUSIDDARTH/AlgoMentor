import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { loadSettings, saveStats } from '@/practice/store'
import { SettingsButton } from './SettingsButton'

const api = vi.hoisted(() => ({ fetchProfile: vi.fn() }))
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), ...api }))
const { ApiError } = await import('@/lib/api')

const LC = { username: 'demo', ranking: 250000, solved: { easy: 140, medium: 150, hard: 22, total: 312 }, topics: [], recent: [] }

function open() {
  render(<TooltipProvider><MemoryRouter><SettingsButton /></MemoryRouter></TooltipProvider>)
  return userEvent.click(screen.getByRole('button', { name: 'Settings' }))
}

beforeEach(() => {
  api.fetchProfile.mockResolvedValue(LC)
})
afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('Settings', () => {
  it('opensFromFixedGear', async () => {
    render(<TooltipProvider><MemoryRouter><SettingsButton /></MemoryRouter></TooltipProvider>)
    const gear = screen.getByRole('button', { name: 'Settings' })
    expect(gear.className).toMatch(/\bfixed\b/)
    await userEvent.click(gear)
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })

  it('invalidUrlShowsFormat', async () => {
    await open()
    await userEvent.type(screen.getByRole('textbox', { name: 'LeetCode profile URL' }), 'https://leetcode.com/problems/two-sum')
    await userEvent.click(screen.getByRole('button', { name: 'Connect LeetCode' }))
    expect(screen.getByText(/Use a link like leetcode.com\/u\/yourname/)).toBeInTheDocument()
    expect(api.fetchProfile).not.toHaveBeenCalled()
  })

  it('connectShowsStats', async () => {
    await open()
    await userEvent.type(screen.getByRole('textbox', { name: 'LeetCode profile URL' }), 'leetcode.com/u/demo')
    await userEvent.click(screen.getByRole('button', { name: 'Connect LeetCode' }))
    expect(api.fetchProfile).toHaveBeenCalledWith('leetcode', 'demo', expect.anything())
    expect(await screen.findByText('312 solved · 140 Easy · 150 Medium · 22 Hard')).toBeInTheDocument()
    expect(loadSettings().leetcode).toBe('demo')
  })

  it('profileErrorShowsOnCard', async () => {
    api.fetchProfile.mockImplementation(async () => { throw new ApiError(404, 'No public profile found for ghost on GeeksforGeeks.') })
    await open()
    await userEvent.type(screen.getByRole('textbox', { name: 'GeeksforGeeks profile URL' }), 'geeksforgeeks.org/user/ghost')
    await userEvent.click(screen.getByRole('button', { name: 'Connect GeeksforGeeks' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No public profile found for ghost')
    expect(loadSettings().gfg).toBeUndefined()
  })

  it('targetAndGoalPersist', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Service company' }))
    await userEvent.click(screen.getByRole('button', { name: 'Intern' }))
    await userEvent.click(screen.getByRole('button', { name: '5 a day' }))
    expect(loadSettings()).toMatchObject({ target: { company: 'service', role: 'intern' }, dailyGoal: 5 })
    expect(screen.getByRole('button', { name: 'Service company' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('usesFreshCachedStatsAndRefreshBypassesThem', async () => {
    localStorage.setItem('algomentor.profile.v1', JSON.stringify({ leetcode: 'demo', target: { company: 'faang', role: 'sde1' }, dailyGoal: 3 }))
    saveStats('leetcode', LC)
    await open()
    expect(screen.getByText('312 solved · 140 Easy · 150 Medium · 22 Hard')).toBeInTheDocument()
    expect(api.fetchProfile).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Refresh LeetCode' }))
    expect(api.fetchProfile).toHaveBeenCalledOnce()
  })

  it('disconnectForgetsProfile', async () => {
    localStorage.setItem('algomentor.profile.v1', JSON.stringify({ leetcode: 'demo', target: { company: 'faang', role: 'sde1' }, dailyGoal: 3 }))
    saveStats('leetcode', LC)
    await open()
    const card = screen.getByRole('region', { name: 'LeetCode' })
    await userEvent.click(within(card).getByRole('button', { name: 'Disconnect LeetCode' }))
    expect(loadSettings().leetcode).toBeUndefined()
  })
})
