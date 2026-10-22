import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RESUME_PROJECTS, matchesFilter } from '@/content/learn/resume-projects'
import { linkRepo, loadGit } from '@/learn/repos'
import { ApiError } from '@/lib/api'
import Resume from './Resume'

const api = vi.hoisted(() => ({ repoHealth: vi.fn(), askStream: vi.fn(), fetchSharedProjects: vi.fn() }))
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), ...api }))

const HEALTH = {
  passed: false,
  details: [
    { ok: true, text: 'README has 4 sections (needs 3: what it is, how to run it, how it works)' },
    { ok: false, text: 'Add a CI workflow under .github/workflows' },
    { ok: true, text: 'Has a license' },
  ],
}

function renderResume() {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={['/resume']}>
        <Routes><Route path="/resume" element={<Resume />} /></Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

const cards = () => Array.from(screen.getByRole('list', { name: 'Resume projects' }).children) as HTMLElement[]

beforeEach(() => {
  api.repoHealth.mockResolvedValue(HEALTH)
  api.fetchSharedProjects.mockResolvedValue([])
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  api.repoHealth.mockReset()
  api.askStream.mockReset()
  api.fetchSharedProjects.mockReset()
})

describe('Resume page', () => {
  it('listsEveryProject', () => {
    renderResume()
    expect(cards()).toHaveLength(RESUME_PROJECTS.length)
    expect(screen.getByText(`${RESUME_PROJECTS.length} projects`)).toBeInTheDocument()
  })

  it('filtersByTargetAndRole', async () => {
    renderResume()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Target' }), 'startup')
    const startup = RESUME_PROJECTS.filter((p) => matchesFilter(p, 'startup', 'all'))
    expect(cards()).toHaveLength(startup.length)
    expect(startup.length).toBeLessThan(RESUME_PROJECTS.length)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Role' }), 'intern')
    const both = RESUME_PROJECTS.filter((p) => matchesFilter(p, 'startup', 'intern'))
    expect(cards()).toHaveLength(both.length)
    expect(screen.getByText(`${both.length} ${both.length === 1 ? 'project' : 'projects'}`)).toBeInTheDocument()
    for (const p of both) expect(screen.getByRole('heading', { name: p.title })).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Target' }), 'all')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Role' }), 'all')
    expect(cards()).toHaveLength(RESUME_PROJECTS.length)
  })

  it('filtersByFocus', async () => {
    renderResume()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Focus' }), 'mobile')
    const mobile = RESUME_PROJECTS.filter((p) => matchesFilter(p, 'all', 'all', 'mobile'))
    expect(cards()).toHaveLength(mobile.length)
    for (const p of mobile) expect(screen.getByRole('heading', { name: p.title })).toBeInTheDocument()
  })

  it('filtersByAnyCompanyThroughItsTier', async () => {
    renderResume()
    const select = screen.getByRole('combobox', { name: 'Company' })
    expect(within(select).getAllByRole('option').length).toBeGreaterThan(200)
    await userEvent.selectOptions(select, 'meta')
    const shown = RESUME_PROJECTS.filter((p) => matchesFilter(p, 'all', 'all', 'all', 'meta'))
    expect(cards()).toHaveLength(shown.length)
    expect(shown.length).toBeLessThan(RESUME_PROJECTS.length)
    expect(screen.getByRole('status')).toHaveTextContent(`${shown.length} projects for Meta`)
  })

  it('theCompanyListFollowsTheTierAndChangingTierClearsAMismatchedCompany', async () => {
    renderResume()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Target' }), 'service')
    const options = within(screen.getByRole('combobox', { name: 'Company' })).getAllByRole('option').map((o) => o.textContent)
    expect(options).toContain('TCS')
    expect(options).not.toContain('Meta')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Company' }), 'tcs')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Target' }), 'maang')
    expect(screen.getByRole('combobox', { name: 'Company' })).toHaveValue('all')
  })

  it('startsOnYourDreamCompanyWhenYouHaveOne', () => {
    localStorage.setItem('algomentor.profile.v1', JSON.stringify({ dailyGoal: 3, target: { company: 'maang', role: 'sde1', employer: 'google' } }))
    renderResume()
    expect(screen.getByRole('combobox', { name: 'Company' })).toHaveValue('google')
  })

  it('everyCardHasABuildItLikeProductionSection', async () => {
    renderResume()
    const p = RESUME_PROJECTS[0]
    const card = cards()[0]
    await userEvent.click(within(card).getByRole('button', { name: /Build it like production/ }))
    expect(within(card).getByText(p.production.architecture)).toBeInTheDocument()
    for (const m of p.production.milestones) expect(within(card).getByText(m)).toBeInTheDocument()
    for (const c of p.production.shipIt) expect(within(card).getByText(c)).toBeInTheDocument()
  })

  it('offersToShareTheProjectThatGotYouIn', async () => {
    renderResume()
    await userEvent.click(screen.getByRole('button', { name: 'Share the project that got you in' }))
    expect(screen.getByRole('dialog', { name: 'Share the project that got you in' })).toBeInTheDocument()
  })

  it('showsReviewedProjectsFromPeopleWhoGotInWithoutAnEmail', async () => {
    api.fetchSharedProjects.mockResolvedValue([{ id: '1', company: 'Atlassian', level: 'sde1', roleTitle: 'Software Engineer, Backend', projectTitle: 'Seat reservation system', summary: 'A booking API where one seat is never sold twice.', whyItHelped: 'It was the centre of my system design round.', stack: 'Spring Boot', repoUrl: 'https://github.com/ana/seats', name: 'Ana G.', linkedin: 'ana-gomez', year: 2026, approvedAt: '2026-10-01T00:00:00Z' }])
    renderResume()
    const region = await screen.findByRole('region', { name: 'From people who got in' })
    expect(within(region).getByText('Seat reservation system')).toBeInTheDocument()
    expect(within(region).getByText(/Atlassian/)).toBeInTheDocument()
    expect(within(region).getByRole('link', { name: /github.com\/ana\/seats/ })).toHaveAttribute('href', 'https://github.com/ana/seats')
    expect(region).toHaveTextContent(/shared by users, reviewed by AlgoMentor, not verified/i)
  })

  it('hidesTheCommunitySectionWhenThereIsNothingToShow', async () => {
    renderResume()
    await vi.waitFor(() => expect(api.fetchSharedProjects).toHaveBeenCalled())
    expect(screen.queryByRole('region', { name: 'From people who got in' })).toBeNull()
  })

  it('creditsTheRepositoryOrRoadmapAProjectCameFrom', () => {
    renderResume()
    const p = RESUME_PROJECTS.find((x) => x.id === 'mini-docker')!
    const card = cards().find((c) => within(c).queryByRole('heading', { name: p.title }))!
    expect(within(card).getByRole('link', { name: new RegExp(p.inspiredBy!.label) })).toHaveAttribute('href', p.inspiredBy!.url)
  })

  it('cardShowsBulletTemplateAndExample', () => {
    renderResume()
    const p = RESUME_PROJECTS[0]
    const card = cards()[0]
    expect(within(card).getByRole('heading', { name: p.title })).toBeInTheDocument()
    expect(within(card).getByText(p.proves)).toBeInTheDocument()
    expect(within(card).getByText(p.bullet.template)).toBeInTheDocument()
    expect(within(card).getByText(p.bullet.example)).toBeInTheDocument()
  })

  it('theIntroExplainsHowToWriteABulletAndNotToInventNumbers', () => {
    renderResume()
    expect(screen.getByRole('region', { name: 'How to write the bullet' })).toBeInTheDocument()
    expect(screen.getByText(/never invent a number/i)).toBeInTheDocument()
  })

  it('repoHealthChecklistUsesLinkedRepo', async () => {
    const p = RESUME_PROJECTS[0]
    linkRepo(`resume-${p.id}`, 'demo', 'library')
    renderResume()
    const card = cards()[0]
    await userEvent.click(within(card).getByRole('button', { name: /Make your GitHub shine/ }))
    expect(within(card).getByText('Linked:', { exact: false })).toHaveTextContent('demo/library')
    await userEvent.click(within(card).getByRole('button', { name: 'Check repository' }))
    expect(await within(card).findByText('Add a CI workflow under .github/workflows')).toBeInTheDocument()
    expect(within(card).getByText('2 of 3 items done')).toBeInTheDocument()
    expect(api.repoHealth).toHaveBeenCalledWith('demo', 'library', expect.anything())
  })

  it('linkingFromACardSavesUnderThatProject', async () => {
    renderResume()
    const card = cards()[2]
    await userEvent.click(within(card).getByRole('button', { name: /Make your GitHub shine/ }))
    expect(within(card).getByRole('button', { name: 'Check repository' })).toBeDisabled()
    await userEvent.type(within(card).getByRole('textbox', { name: 'GitHub repository link' }), 'https://github.com/ana/limiter.git')
    await userEvent.click(within(card).getByRole('button', { name: 'Link repository' }))
    expect(loadGit().repos[`resume-${RESUME_PROJECTS[2].id}`]).toMatchObject({ owner: 'ana', repo: 'limiter' })
  })

  it('aPrivateRepoShowsTheServerMessage', async () => {
    const p = RESUME_PROJECTS[0]
    linkRepo(`resume-${p.id}`, 'demo', 'library')
    api.repoHealth.mockRejectedValue(new ApiError(404, 'Make the repository public to verify it.'))
    renderResume()
    const card = cards()[0]
    await userEvent.click(within(card).getByRole('button', { name: /Make your GitHub shine/ }))
    await userEvent.click(within(card).getByRole('button', { name: 'Check repository' }))
    expect(await within(card).findByText('Make the repository public to verify it.')).toBeInTheDocument()
  })

  it('anUnexpectedErrorDoesNotCrashThePage', async () => {
    const p = RESUME_PROJECTS[0]
    linkRepo(`resume-${p.id}`, 'demo', 'library')
    api.repoHealth.mockRejectedValue(new TypeError('Failed to fetch'))
    renderResume()
    const card = cards()[0]
    await userEvent.click(within(card).getByRole('button', { name: /Make your GitHub shine/ }))
    await userEvent.click(within(card).getByRole('button', { name: 'Check repository' }))
    expect(await within(card).findByText(/Couldn't reach AlgoMentor/)).toBeInTheDocument()
    expect(cards()).toHaveLength(RESUME_PROJECTS.length)
  })

  it('noAskCallsOnTheResumePage', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderResume()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Target' }), 'maang')
    expect(fetchSpy.mock.calls.filter(([u]) => String(u).includes('/ask'))).toHaveLength(0)
    expect(api.askStream).not.toHaveBeenCalled()
  })
})
