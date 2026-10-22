import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PROJECT_BY_ID } from '@/content/learn/projects'
import { ApiError } from '@/lib/api'
import { checkKey, linkRepo, loadGit, recordCheck } from '@/learn/repos'
import LearnTrack from './LearnTrack'
import Project from './Project'

const api = vi.hoisted(() => ({ checkGit: vi.fn() }))
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), ...api }))

const project = PROJECT_BY_ID.get('library-manager')!
/** The milestone rows only: each row can hold a nested list of check details. */
const milestoneRows = () => Array.from(screen.getByRole('list', { name: 'Git milestones' }).children) as HTMLElement[]

const PASS = { passed: true, details: [{ ok: true, text: 'README found' }] }
const FAIL = { passed: false, details: [{ ok: false, text: 'No merge commit on main touches conflict.txt yet' }] }

function renderProject(id = project.id) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[`/projects/${id}`]}>
        <Routes>
          <Route path="/projects/:projectId" element={<Project />} />
          <Route path="/learn/:trackId" element={<LearnTrack />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

async function link(url = 'https://github.com/demo/library') {
  await userEvent.type(screen.getByRole('textbox', { name: 'GitHub repository link' }), url)
  await userEvent.click(screen.getByRole('button', { name: 'Link repository' }))
}

beforeEach(() => {
  api.checkGit.mockImplementation(async (_o: string, _r: string, challenge: string) => (project.gitMilestones.slice(0, 3).includes(challenge as never) ? PASS : FAIL))
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  api.checkGit.mockReset()
})

describe('Project page', () => {
  it('projectPageShowsSpecAndMilestones', () => {
    renderProject()
    expect(screen.getByRole('heading', { level: 1, name: project.title })).toBeInTheDocument()
    expect(screen.getByText(project.goal)).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Requirements' })).getAllByRole('listitem')).toHaveLength(project.requirements.length)
    expect(within(screen.getByRole('region', { name: 'Stretch goals' })).getAllByRole('listitem')).toHaveLength(project.stretch.length)
    expect(within(screen.getByRole('region', { name: 'Acceptance checklist' })).getAllByRole('listitem')).toHaveLength(project.acceptance.length)
    const items = milestoneRows()
    expect(items).toHaveLength(project.gitMilestones.length)
    expect(within(items[0]).getByRole('link', { name: /First commit/ })).toHaveAttribute('href', '/git/first-commit')
  })

  it('milestonesAskForARepoFirst', () => {
    renderProject()
    for (const b of screen.getAllByRole('button', { name: /^Check / })) expect(b).toBeDisabled()
    expect(screen.getByText(/Link your repository to check milestones/)).toBeInTheDocument()
  })

  it('linkRepoAndRunChecksShowsPerMilestoneStatus', async () => {
    renderProject()
    await link()
    expect(loadGit().repos[project.id]).toMatchObject({ owner: 'demo', repo: 'library' })
    await userEvent.click(screen.getByRole('button', { name: 'Check all milestones' }))
    expect(await screen.findByText('3 of 4 milestones passed')).toBeInTheDocument() // checks run one after another
    const items = milestoneRows()
    expect(within(items[0]).getByText(/^Passed /)).toBeInTheDocument()
    expect(within(items[1]).getByText(/^Passed /)).toBeInTheDocument()
    expect(within(items[2]).getByText(/^Passed /)).toBeInTheDocument()
    expect(within(items[3]).getByText('Not yet')).toBeInTheDocument()
    expect(within(items[3]).getByText('No merge commit on main touches conflict.txt yet')).toBeInTheDocument()
    expect(api.checkGit).toHaveBeenCalledWith('demo', 'library', 'first-commit', expect.anything())
  })

  it('aBadLinkShowsAFormatErrorAndSavesNothing', async () => {
    renderProject()
    await link('https://gitlab.com/ana/library')
    expect(screen.getByRole('alert')).toHaveTextContent('Use a repository link like https://github.com/you/your-repo.')
    expect(loadGit().repos).toEqual({})
  })

  it('privateAfterPassKeepsRecord', async () => {
    linkRepo(project.id, 'demo', 'library')
    recordCheck(checkKey(project.id, 'first-commit'), PASS, new Date(2026, 9, 1).getTime())
    api.checkGit.mockRejectedValue(new ApiError(404, 'Make the repository public to verify it.'))
    renderProject()
    const first = milestoneRows()[0]
    expect(within(first).getByText('Passed Oct 1')).toBeInTheDocument()
    await userEvent.click(within(first).getByRole('button', { name: /^Check / }))
    expect(await within(first).findByText('Make the repository public to verify it.')).toBeInTheDocument()
    expect(within(first).getByText('Passed Oct 1')).toBeInTheDocument()
    expect(within(first).getByText(/Now failing/)).toBeInTheDocument()
    expect(loadGit().checks[checkKey(project.id, 'first-commit')]?.passedAt).toBe(new Date(2026, 9, 1).getTime())
  })

  it('anUnexpectedErrorDoesNotCrashThePage', async () => {
    linkRepo(project.id, 'demo', 'library')
    api.checkGit.mockRejectedValue(new TypeError('Failed to fetch'))
    renderProject()
    const first = milestoneRows()[0]
    await userEvent.click(within(first).getByRole('button', { name: /^Check / }))
    expect(await within(first).findByText(/Couldn't reach AlgoMentor/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: project.title })).toBeInTheDocument()
  })

  it('unlinkingKeepsPassedRecordsVisible', async () => {
    linkRepo(project.id, 'demo', 'library')
    recordCheck(checkKey(project.id, 'first-commit'), PASS, new Date(2026, 9, 1).getTime())
    renderProject()
    await userEvent.click(screen.getByRole('button', { name: 'Unlink repository' }))
    expect(screen.getByRole('textbox', { name: 'GitHub repository link' })).toBeInTheDocument()
    expect(screen.getByText('Passed Oct 1')).toBeInTheDocument()
  })

  it('projectPageHasNoMentorPanel', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderProject()
    await link()
    await userEvent.click(screen.getByRole('button', { name: 'Check all milestones' }))
    await screen.findAllByText(/^Passed /)
    expect(fetchSpy.mock.calls.filter(([u]) => String(u).includes('/ask'))).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /hint/i })).toBeNull()
    expect(screen.queryByRole('complementary', { name: /mentor/i })).toBeNull()
  })

  it('unknownProjectShowsNotFound', () => {
    renderProject('nope')
    expect(screen.getByRole('heading', { name: 'Project not found' })).toBeInTheDocument()
  })

  it('trackPageListsItsProjects', () => {
    render(
      <TooltipProvider>
        <MemoryRouter initialEntries={['/learn/oop']}>
          <Routes><Route path="/learn/:trackId" element={<LearnTrack />} /></Routes>
        </MemoryRouter>
      </TooltipProvider>,
    )
    const list = screen.getByRole('list', { name: 'Projects' })
    expect(within(list).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/projects/library-manager', '/projects/parking-lot', '/projects/expense-splitter'])
  })
})
