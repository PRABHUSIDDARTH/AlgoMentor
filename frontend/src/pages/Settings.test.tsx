import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { loadProgress } from '@/practice/progress'
import { loadPhoto } from '@/practice/photo'
import { loadSettings, saveStats } from '@/practice/store'
import Settings from './Settings'

const api = vi.hoisted(() => ({ fetchProfile: vi.fn() }))
const photo = vi.hoisted(() => ({ readPhoto: vi.fn() }))
vi.mock('@/practice/photo', async (orig) => ({ ...(await orig<typeof import('@/practice/photo')>()), ...photo }))
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), ...api }))
const { ApiError } = await import('@/lib/api')

const LC = { username: 'demo', ranking: 250000, solved: { easy: 140, medium: 150, hard: 22, total: 312 }, topics: [], recent: [] }

async function open() {
  render(
    <TooltipProvider>
      <MemoryRouter initialEntries={['/about/settings']}>
        <Routes><Route path="/about/settings" element={<Settings />} /></Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

beforeEach(() => {
  api.fetchProfile.mockResolvedValue(LC)
})
afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('Settings', () => {
  it('isAPageWithASettingsHeading', async () => {
    await open()
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
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

  it('connectingLeetCodeSyncsRecentSolvesIntoTheRoadmap', async () => {
    api.fetchProfile.mockResolvedValue({ ...LC, recent: [{ slug: 'two-sum', title: 'Two Sum', solvedAt: 1_790_000_000 }, { slug: 'not-on-roadmap', title: 'x', solvedAt: 1 }] })
    await open()
    await userEvent.type(screen.getByRole('textbox', { name: 'LeetCode profile URL' }), 'leetcode.com/u/demo')
    await userEvent.click(screen.getByRole('button', { name: 'Connect LeetCode' }))
    expect(await screen.findByText('1 recent solve added to your roadmap')).toBeInTheDocument()
    expect(loadProgress()['two-sum']?.status).toBe('solved')
  })

  it('refreshAsksTheServerToBypassItsCache', async () => {
    localStorage.setItem('algomentor.profile.v1', JSON.stringify({ leetcode: 'demo', target: { company: 'maang', role: 'sde1' }, dailyGoal: 3 }))
    saveStats('leetcode', LC)
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Refresh LeetCode' }))
    expect(api.fetchProfile).toHaveBeenCalledWith('leetcode', 'demo', expect.anything(), { refresh: true })
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
    await userEvent.click(screen.getByRole('button', { name: 'Service and IT consulting' }))
    await userEvent.click(screen.getByRole('button', { name: 'Intern' }))
    await userEvent.click(screen.getByRole('button', { name: '5 a day' }))
    expect(loadSettings()).toMatchObject({ target: { company: 'service', role: 'intern' }, dailyGoal: 5 })
    expect(screen.getByRole('button', { name: 'Service and IT consulting' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('usesFreshCachedStatsAndRefreshBypassesThem', async () => {
    localStorage.setItem('algomentor.profile.v1', JSON.stringify({ leetcode: 'demo', target: { company: 'maang', role: 'sde1' }, dailyGoal: 3 }))
    saveStats('leetcode', LC)
    await open()
    expect(screen.getByText('312 solved · 140 Easy · 150 Medium · 22 Hard')).toBeInTheDocument()
    expect(api.fetchProfile).not.toHaveBeenCalled()
    // Visible text must be part of the accessible name (WCAG 2.5.3).
    const refresh = screen.getByRole('button', { name: 'Refresh LeetCode' })
    expect(refresh).toHaveTextContent(/^Refresh$/)
    await userEvent.click(refresh)
    expect(api.fetchProfile).toHaveBeenCalledOnce()
  })

  it('disconnectForgetsProfile', async () => {
    localStorage.setItem('algomentor.profile.v1', JSON.stringify({ leetcode: 'demo', target: { company: 'maang', role: 'sde1' }, dailyGoal: 3 }))
    saveStats('leetcode', LC)
    await open()
    const card = screen.getByRole('region', { name: 'LeetCode' })
    await userEvent.click(within(card).getByRole('button', { name: 'Disconnect LeetCode' }))
    expect(loadSettings().leetcode).toBeUndefined()
  })

  it('offersEveryTierLevelAndFocus', async () => {
    await open()
    const tier = screen.getByRole('group', { name: 'Tier' })
    expect(within(tier).getAllByRole('button').map((b) => b.textContent)).toEqual(['MAANG', 'Big tech and product', 'Startups', 'Service and IT consulting'])
    const level = screen.getByRole('group', { name: 'Level' })
    expect(within(level).getAllByRole('button').map((b) => b.textContent)).toEqual(['Intern', 'SDE-1', 'SDE-2', 'Senior SDE'])
    const focus = screen.getByRole('group', { name: 'Focus' })
    expect(within(focus).getAllByRole('button').map((b) => b.textContent)).toEqual(['General', 'Backend', 'Frontend', 'Full stack', 'Mobile', 'Data', 'DevOps and SRE', 'Test and QA'])
  })

  it('focusIsSaved', async () => {
    await open()
    await userEvent.click(within(screen.getByRole('group', { name: 'Focus' })).getByRole('button', { name: 'Backend' }))
    expect(loadSettings().target.focus).toBe('backend')
    expect(within(screen.getByRole('group', { name: 'Focus' })).getByRole('button', { name: 'Backend' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('theDreamCompanyPickerFindsAnyCompanyAndSetsItsTier', async () => {
    await open()
    await userEvent.type(screen.getByRole('combobox', { name: 'Dream company' }), 'flip')
    await userEvent.click(await screen.findByRole('option', { name: /Flipkart/ }))
    expect(loadSettings().target).toMatchObject({ company: 'product', employer: 'flipkart' })
    expect(screen.getByText('Dream company: Flipkart')).toBeInTheDocument()
  })

  it('changingTierDropsAnEmployerFromAnotherTier', async () => {
    localStorage.setItem('algomentor.profile.v1', JSON.stringify({ target: { company: 'maang', role: 'sde1', employer: 'meta' }, dailyGoal: 3 }))
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Startups' }))
    expect(loadSettings().target).toMatchObject({ company: 'startup' })
    expect(loadSettings().target.employer).toBeUndefined()
  })

  it('clearingTheDreamCompanyKeepsTheTier', async () => {
    localStorage.setItem('algomentor.profile.v1', JSON.stringify({ target: { company: 'maang', role: 'sde1', employer: 'meta' }, dailyGoal: 3 }))
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Clear dream company' }))
    expect(loadSettings().target).toEqual({ company: 'maang', role: 'sde1' })
  })

  it('savesNameEmailAndLinkedIn', async () => {
    await open()
    await userEvent.type(screen.getByRole('textbox', { name: 'Name on your card' }), 'Ana Gomez')
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'ana@example.com')
    await userEvent.type(screen.getByRole('textbox', { name: 'LinkedIn profile URL' }), 'https://www.linkedin.com/in/ana-gomez/')
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }))
    expect(loadSettings()).toMatchObject({ name: 'Ana Gomez', email: 'ana@example.com', linkedin: 'ana-gomez' })
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
  })

  it('explainsABadLinkedInLinkAndSavesNothing', async () => {
    await open()
    await userEvent.type(screen.getByRole('textbox', { name: 'LinkedIn profile URL' }), 'https://www.linkedin.com/company/acme')
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }))
    expect(screen.getByRole('alert')).toHaveTextContent('linkedin.com/in/yourname')
    expect(loadSettings().linkedin).toBeUndefined()
  })

  it('addsAPhotoForTheCardAndRemovesIt', async () => {
    photo.readPhoto.mockResolvedValue('data:image/jpeg;base64,/9j/4AAQ')
    await open()
    await userEvent.upload(screen.getByLabelText('Photo for your card'), new File(['x'], 'me.png', { type: 'image/png' }))
    expect(loadPhoto()).toBe('data:image/jpeg;base64,/9j/4AAQ')
    expect(await screen.findByText('Photo added. It stays in this browser.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove photo' }))
    expect(loadPhoto()).toBeNull()
  })

  it('explainsWhyAPhotoWasRefused', async () => {
    photo.readPhoto.mockRejectedValue(new Error('Choose an image file.'))
    await open()
    await userEvent.upload(screen.getByLabelText('Photo for your card'), new File(['x'], 'notes.txt', { type: 'text/plain' }), { applyAccept: false })
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose an image file.')
    expect(loadPhoto()).toBeNull()
  })

  it('hasAGitHubProfileCard', async () => {
    await open()
    expect(screen.getByRole('textbox', { name: 'GitHub profile URL' })).toBeInTheDocument()
  })
})
