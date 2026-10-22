import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import AdminReview from './AdminReview'

const api = vi.hoisted(() => ({ fetchPendingContributions: vi.fn(), decideContribution: vi.fn() }))
vi.mock('@/lib/api', async (orig) => ({ ...(await orig<typeof import('@/lib/api')>()), ...api }))
const { ApiError } = await import('@/lib/api')

const ITEM = { id: 'c1', status: 'PENDING', submittedAt: '2026-10-22T10:00:00Z', company: 'Atlassian', level: 'sde1', roleTitle: 'Engineer', projectTitle: 'Seat reservation system', summary: 'A booking API.', whyItHelped: 'System design.', stack: 'Spring', repoUrl: 'https://github.com/ana/seats', name: 'Ana', linkedin: null, email: 'ana@example.com', year: 2026 }

function renderPage() {
  render(<TooltipProvider><MemoryRouter><AdminReview /></MemoryRouter></TooltipProvider>)
}
async function signIn(token = 'secret') {
  await userEvent.type(screen.getByLabelText('Admin token'), token)
  await userEvent.click(screen.getByRole('button', { name: 'Load pending' }))
}

beforeEach(() => api.fetchPendingContributions.mockResolvedValue([ITEM]))
afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
  api.fetchPendingContributions.mockReset()
  api.decideContribution.mockReset()
})

describe('Review page', () => {
  it('listsPendingEntriesForAReviewerIncludingTheEmail', async () => {
    renderPage()
    await signIn()
    expect(api.fetchPendingContributions).toHaveBeenCalledWith('secret', expect.anything())
    const row = await screen.findByRole('article', { name: 'Seat reservation system' })
    expect(row).toHaveTextContent('ana@example.com')
    expect(row).toHaveTextContent('Atlassian')
  })

  it('approvingOrRejectingCallsTheServerAndRemovesTheEntry', async () => {
    api.decideContribution.mockResolvedValue(undefined)
    renderPage()
    await signIn()
    const row = await screen.findByRole('article', { name: 'Seat reservation system' })
    await userEvent.click(within(row).getByRole('button', { name: 'Approve' }))
    expect(api.decideContribution).toHaveBeenCalledWith('secret', 'c1', 'approve', expect.anything())
    expect(screen.queryByRole('article', { name: 'Seat reservation system' })).toBeNull()
    expect(screen.getByText('Nothing waiting for review.')).toBeInTheDocument()
  })

  it('rejectWorksToo', async () => {
    api.decideContribution.mockResolvedValue(undefined)
    renderPage()
    await signIn()
    await userEvent.click(within(await screen.findByRole('article', { name: 'Seat reservation system' })).getByRole('button', { name: 'Reject' }))
    expect(api.decideContribution).toHaveBeenCalledWith('secret', 'c1', 'reject', expect.anything())
  })

  it('aWrongTokenShowsTheServersMessage', async () => {
    api.fetchPendingContributions.mockRejectedValue(new ApiError(401, 'Review needs the admin token.'))
    renderPage()
    await signIn('nope')
    expect(await screen.findByRole('alert')).toHaveTextContent('Review needs the admin token.')
  })

  it('keepsTheTokenOnlyForThisTab', async () => {
    renderPage()
    await signIn()
    await screen.findByRole('article', { name: 'Seat reservation system' })
    expect(sessionStorage.getItem('algomentor.admin')).toBe('secret')
    expect(localStorage.getItem('algomentor.admin')).toBeNull()
  })
})
