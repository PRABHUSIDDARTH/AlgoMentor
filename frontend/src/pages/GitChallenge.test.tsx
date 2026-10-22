import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { GIT_CHALLENGES, GIT_CHALLENGE_BY_ID } from '@/content/learn/git-challenges'
import { checkKey, linkRepo, loadGit, PRACTICE_SCOPE, recordCheck } from '@/learn/repos'
import GitChallenge from './GitChallenge'
import GitHub from './GitHub'

const api = vi.hoisted(() => ({ checkGit: vi.fn(), askStream: vi.fn() }))
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), ...api }))

const PASS = { passed: true, details: [{ ok: true, text: 'A merge commit on main resolves conflict.txt' }] }

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/git" element={<GitHub />} />
          <Route path="/git/:challengeId" element={<GitChallenge />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

beforeEach(() => {
  api.checkGit.mockResolvedValue(PASS)
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  api.checkGit.mockReset()
  api.askStream.mockReset()
})

describe('Git challenges list', () => {
  it('listsTenChallengesInOrder', () => {
    renderAt('/git')
    const list = screen.getByRole('list', { name: 'Challenges' })
    const rows = Array.from(list.children) as HTMLElement[]
    expect(rows).toHaveLength(10)
    rows.forEach((row, i) => {
      const c = GIT_CHALLENGES[i]
      expect(within(row).getByRole('link', { name: new RegExp(c.title) })).toHaveAttribute('href', `/git/${c.id}`)
      expect(within(row).getByText(`${i + 1}`)).toBeInTheDocument()
    })
  })

  it('showsProgressFromEveryProject', () => {
    recordCheck(checkKey('library-manager', 'first-commit'), PASS, new Date(2026, 9, 1).getTime())
    renderAt('/git')
    expect(screen.getByText('1 of 10 challenges passed')).toBeInTheDocument()
    const first = (Array.from(screen.getByRole('list', { name: 'Challenges' }).children) as HTMLElement[])[0]
    expect(within(first).getByText('Passed Oct 1')).toBeInTheDocument()
  })

  it('statesTheNoAiRuleInOnePlainSentence', () => {
    renderAt('/git')
    expect(screen.getByText(/no AI on these pages/i)).toBeInTheDocument()
  })
})

describe('Git challenge page', () => {
  const c = GIT_CHALLENGE_BY_ID.get('merge-conflict')!

  it('challengePageShowsBriefScriptCheatSheetAndDocs', () => {
    renderAt('/git/merge-conflict')
    expect(screen.getByRole('heading', { level: 1, name: c.title })).toBeInTheDocument()
    expect(screen.getByText(c.brief)).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Steps' })).getAllByRole('listitem')).toHaveLength(c.steps.length)
    expect(screen.getByRole('region', { name: 'Set up the challenge' })).toBeInTheDocument()
    const sheet = screen.getByRole('table', { name: 'Commands for this challenge' })
    expect(within(sheet).getAllByRole('row')).toHaveLength(c.cheatSheet.length + 1)
    for (const d of c.docs) expect(screen.getByRole('link', { name: new RegExp(d.label) })).toHaveAttribute('href', expect.stringMatching(/^https:\/\/git-scm\.com\//))
    expect(screen.getByText(c.passesWhen)).toBeInTheDocument()
  })

  it('unscriptedChallengesHaveNoSetupBox', () => {
    renderAt('/git/first-commit')
    expect(screen.queryByRole('region', { name: 'Set up the challenge' })).toBeNull()
  })

  it('statesTheNoAiRuleNearTheTop', () => {
    renderAt('/git/merge-conflict')
    const rule = screen.getByText(/No AI on Git pages/)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.compareDocumentPosition(rule) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(rule.compareDocumentPosition(screen.getByRole('heading', { name: 'Steps' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('scriptCommandCopyable', async () => {
    const user = userEvent.setup()
    renderAt('/git/merge-conflict')
    const box = screen.getByRole('region', { name: 'Set up the challenge' })
    const bash = within(box).getByRole('group', { name: 'bash' })
    const ps = within(box).getByRole('group', { name: 'PowerShell' })
    expect(within(bash).getByText(/\/git-challenges\/conflict\.sh/)).toBeInTheDocument()
    expect(within(ps).getByText(/\/git-challenges\/conflict\.ps1/)).toBeInTheDocument()
    await user.click(within(bash).getByRole('button', { name: 'Copy bash command' }))
    expect(await navigator.clipboard.readText()).toContain('/git-challenges/conflict.sh')
    await user.click(within(ps).getByRole('button', { name: 'Copy PowerShell command' }))
    expect(await navigator.clipboard.readText()).toContain('/git-challenges/conflict.ps1')
  })

  it('theCommandsDownloadFirstAndNeverPipeIntoAShell', () => {
    renderAt('/git/merge-conflict')
    const box = screen.getByRole('region', { name: 'Set up the challenge' })
    expect(box.textContent).not.toMatch(/\|\s*(ba)?sh\b|\|\s*iex|Invoke-Expression/i)
  })

  it('checkAsksForARepoFirst', async () => {
    renderAt('/git/merge-conflict')
    expect(screen.getByRole('button', { name: 'Check this challenge' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'GitHub repository link' })).toBeInTheDocument()
  })

  it('checkUsesLinkedRepo', async () => {
    linkRepo(PRACTICE_SCOPE, 'demo', 'library')
    renderAt('/git/merge-conflict')
    await userEvent.click(screen.getByRole('button', { name: 'Check this challenge' }))
    expect(await screen.findByText(/^Passed /)).toBeInTheDocument()
    expect(api.checkGit).toHaveBeenCalledWith('demo', 'library', 'merge-conflict', expect.anything())
    expect(loadGit().checks[checkKey(PRACTICE_SCOPE, 'merge-conflict')]?.passedAt).toBeTypeOf('number')
    expect(screen.getByText('A merge commit on main resolves conflict.txt')).toBeInTheDocument()
  })

  it('fallsBackToTheLastProjectRepoAndSaysSo', async () => {
    linkRepo('library-manager', 'ana', 'library')
    renderAt('/git/merge-conflict')
    expect(screen.getByText(/Library manager/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Check this challenge' }))
    await screen.findByText(/^Passed /)
    expect(api.checkGit).toHaveBeenCalledWith('ana', 'library', 'merge-conflict', expect.anything())
  })

  it('aPrivateRepoShowsTheServerMessageAndKeepsAnEarlierPass', async () => {
    const { ApiError } = await import('@/lib/api')
    linkRepo(PRACTICE_SCOPE, 'demo', 'library')
    recordCheck(checkKey(PRACTICE_SCOPE, 'merge-conflict'), PASS, new Date(2026, 9, 1).getTime())
    api.checkGit.mockRejectedValue(new ApiError(404, 'Make the repository public to verify it.'))
    renderAt('/git/merge-conflict')
    await userEvent.click(screen.getByRole('button', { name: 'Check this challenge' }))
    expect(await screen.findByText('Make the repository public to verify it.')).toBeInTheDocument()
    expect(screen.getByText('Passed Oct 1')).toBeInTheDocument()
    expect(screen.getByText(/Now failing/)).toBeInTheDocument()
  })

  it('noAskCallsOnGitPages', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    linkRepo(PRACTICE_SCOPE, 'demo', 'library')
    renderAt('/git')
    await userEvent.click(screen.getAllByRole('link', { name: /Resolve a merge conflict/ })[0])
    await userEvent.click(screen.getByRole('button', { name: 'Check this challenge' }))
    await screen.findByText(/^Passed /)
    expect(fetchSpy.mock.calls.filter(([u]) => String(u).includes('/ask'))).toHaveLength(0)
    expect(api.askStream).not.toHaveBeenCalled()
  })

  it('noMentorPanel', () => {
    renderAt('/git/squash')
    expect(screen.queryByRole('button', { name: /hint/i })).toBeNull()
    expect(screen.queryByRole('complementary', { name: /mentor/i })).toBeNull()
    expect(screen.queryByText(/ask the mentor/i)).toBeNull()
  })

  it('previousAndNextNavigation', () => {
    renderAt('/git/merge-conflict')
    expect(screen.getByRole('link', { name: /Previous: Feature branch and pull request/ })).toHaveAttribute('href', '/git/feature-pr')
    expect(screen.getByRole('link', { name: /Next: Squash with interactive rebase/ })).toHaveAttribute('href', '/git/squash')
  })

  it('unknownChallengeShowsNotFound', () => {
    renderAt('/git/nope')
    expect(screen.getByRole('heading', { name: 'Challenge not found' })).toBeInTheDocument()
  })
})
