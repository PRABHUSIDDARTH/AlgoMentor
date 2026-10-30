import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { saveSettings, saveStats, DEFAULT_SETTINGS } from '@/practice/store'
import About from './About'

const api = vi.hoisted(() => ({ fetchProfile: vi.fn() }))
vi.mock('@/lib/api', async (orig) => ({ ...(await orig<typeof import('@/lib/api')>()), ...api }))

const GH = { username: 'anagomez', publicRepos: 12, followers: 30, stars: 48, languages: ['Java', 'TypeScript'], lastPushAt: 1_790_000_000 }

function renderAbout() {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={['/about']}>
        <Routes><Route path="/about" element={<About />} /><Route path="/about/settings" element={<p>settings page</p>} /></Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

beforeEach(() => api.fetchProfile.mockResolvedValue(GH))
afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  api.fetchProfile.mockReset()
})

describe('About page', () => {
  it('asksForADreamCompanyWhenThereIsNone', () => {
    renderAbout()
    expect(screen.getByRole('heading', { level: 1, name: 'About you' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Choose your dream company' })).toHaveAttribute('href', '/about/settings')
    expect(screen.queryByRole('img', { name: /Dream ID/ })).toBeNull()
  })

  it('showsTheDreamIdForTheChosenCompanyWithReadiness', () => {
    saveSettings({ ...DEFAULT_SETTINGS, name: 'Ana Gomez', target: { company: 'maang', role: 'sde2', employer: 'meta' } })
    renderAbout()
    const card = screen.getByRole('img', { name: 'Dream ID for Ana Gomez: aspiring SDE-2 at Meta' })
    expect(card).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Readiness for Meta SDE-2' })).toBeInTheDocument()
    expect(screen.getByText(/DSA 0%/)).toBeInTheDocument()
    expect(screen.getByText(/Core CS 0%/)).toBeInTheDocument()
  })

  it('listsTheNextStepsThatWouldMoveTheNumber', () => {
    saveSettings({ ...DEFAULT_SETTINGS, target: { company: 'maang', role: 'sde1', employer: 'google' } })
    renderAbout()
    const steps = screen.getByRole('list', { name: 'Next steps' })
    expect(within(steps).getAllByRole('listitem').length).toBeGreaterThanOrEqual(2)
  })

  it('showsTheConnectedProfilesWithLiveStats', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, github: 'anagomez', target: { company: 'maang', role: 'sde1', employer: 'meta' } })
    saveStats('github', GH)
    renderAbout()
    const tile = screen.getByRole('region', { name: 'GitHub' })
    expect(tile).toHaveTextContent('12 public repos · 48 stars · 30 followers')
    expect(within(tile).getByRole('link', { name: /github.com\/anagomez/ })).toHaveAttribute('href', 'https://github.com/anagomez')
  })

  it('refreshesStaleProfilesOnOpen', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, github: 'anagomez' })
    renderAbout()
    await vi.waitFor(() => expect(api.fetchProfile).toHaveBeenCalledWith('github', 'anagomez', expect.anything(), { refresh: true }))
  })

  it('linksToLinkedInWithoutReadingIt', () => {
    saveSettings({ ...DEFAULT_SETTINGS, linkedin: 'ana-gomez' })
    renderAbout()
    expect(screen.getByRole('link', { name: /linkedin.com\/in\/ana-gomez/ })).toHaveAttribute('href', 'https://www.linkedin.com/in/ana-gomez')
    expect(api.fetchProfile).not.toHaveBeenCalled()
  })

  it('hasASettingsGearInTheHeader', async () => {
    renderAbout()
    await userEvent.click(screen.getByRole('link', { name: 'Edit profile settings' }))
    expect(screen.getByText('settings page')).toBeInTheDocument()
  })

  it('shareOnLinkedInOpensTheComposerWithAGoalNotAJobClaim', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, name: 'Ana', target: { company: 'maang', role: 'sde1', employer: 'meta' } })
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    renderAbout()
    await userEvent.click(screen.getByRole('button', { name: 'Share on LinkedIn' }))
    expect(open).toHaveBeenCalledOnce()
    const url = new URL(String(open.mock.calls[0][0]))
    expect(url.hostname).toBe('www.linkedin.com')
    expect(url.searchParams.get('text')).toContain('working toward an SDE-1 role at Meta')
    expect(open.mock.calls[0][1]).toBe('_blank')
    expect(open.mock.calls[0][2]).toContain('noopener')
    expect(await screen.findByRole('status')).toHaveTextContent(/attach/i)
  })

  it('copiesThePostText', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, target: { company: 'maang', role: 'sde1', employer: 'meta' } })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderAbout()
    await userEvent.click(screen.getByRole('button', { name: 'Copy post text' }))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('ready'))
  })

  it('saysItIsNotAffiliatedWithTheCompany', () => {
    saveSettings({ ...DEFAULT_SETTINGS, target: { company: 'maang', role: 'sde1', employer: 'meta' } })
    renderAbout()
    expect(screen.getByText(/not affiliated with Meta/i)).toBeInTheDocument()
  })
})
