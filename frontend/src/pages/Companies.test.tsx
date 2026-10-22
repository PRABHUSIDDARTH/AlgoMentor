import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { COMPANIES, companiesByTier, companyById } from '@/content/companies'
import { loadSettings } from '@/practice/store'
import Companies from './Companies'
import Company from './Company'

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:companyId" element={<Company />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

afterEach(() => localStorage.clear())

describe('Companies page', () => {
  it('listsEveryCompanyUnderItsTier', () => {
    renderAt('/companies')
    for (const [tier, label] of [['maang', 'MAANG'], ['product', 'Big tech and product'], ['startup', 'Startups'], ['service', 'Service and IT consulting']] as const) {
      const section = screen.getByRole('region', { name: label })
      const links = within(section).getAllByRole('link')
      expect(links.map((a) => a.getAttribute('href'))).toEqual(companiesByTier(tier).map((c) => `/companies/${c.id}`))
    }
    expect(screen.getAllByRole('link', { name: /^[A-Z]/ }).filter((a) => a.getAttribute('href')?.startsWith('/companies/'))).toHaveLength(COMPANIES.length)
  })

  it('eachCardShowsTheSummaryAndHowManyRounds', () => {
    renderAt('/companies')
    const meta = companyById('meta')!
    const section = screen.getByRole('region', { name: 'MAANG' })
    expect(within(section).getByText(meta.summary)).toBeInTheDocument()
    expect(within(section).getAllByText(`${meta.rounds.length} stages`).length).toBeGreaterThan(0)
  })

  it('markCandidateReportedCompanies', () => {
    renderAt('/companies')
    expect(screen.getAllByText('From candidate reports')).toHaveLength(COMPANIES.filter((c) => c.reported).length)
  })
})

describe('Company page', () => {
  it('showsTheRoundsInOrderWithTheirSources', () => {
    const meta = companyById('meta')!
    renderAt('/companies/meta')
    expect(screen.getByRole('heading', { level: 1, name: 'Meta' })).toBeInTheDocument()
    const rounds = screen.getByRole('list', { name: 'Interview process' })
    expect(within(rounds).getAllByRole('listitem').map((li) => li.querySelector('h3')?.textContent)).toEqual(meta.rounds.map((r) => r.name))
    const sources = screen.getByRole('list', { name: 'Sources' })
    for (const s of meta.sources) expect(within(sources).getByRole('link', { name: new RegExp(s.label) })).toHaveAttribute('href', s.url)
    expect(screen.getByText(/Last read on 22 Oct 2026/)).toBeInTheDocument()
  })

  it('warnsWhenTheEntryIsBuiltFromCandidateReports', () => {
    renderAt('/companies/apple')
    expect(screen.getByRole('note')).toHaveTextContent(/candidate reports/i)
  })

  it('doesNotWarnForOfficialSources', () => {
    renderAt('/companies/google')
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('setAsMyTargetSavesTheTierAndEmployerAndKeepsLevelAndFocus', async () => {
    localStorage.setItem('algomentor.profile.v1', JSON.stringify({ dailyGoal: 3, target: { company: 'service', role: 'sde2', focus: 'backend' } }))
    renderAt('/companies/meta')
    await userEvent.click(screen.getByRole('button', { name: 'Set Meta as my target' }))
    expect(loadSettings().target).toEqual({ company: 'maang', role: 'sde2', focus: 'backend', employer: 'meta' })
    expect(screen.getByText('Meta is your target.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Set Meta as my target' })).toBeNull()
  })

  it('saysWhenItIsAlreadyTheTarget', () => {
    localStorage.setItem('algomentor.profile.v1', JSON.stringify({ dailyGoal: 3, target: { company: 'maang', role: 'sde1', employer: 'google' } }))
    renderAt('/companies/google')
    expect(screen.getByText('Google is your target.')).toBeInTheDocument()
  })

  it('explainsWhatTheEmphasisChangesWhenThereIsOne', () => {
    renderAt('/companies/meta')
    expect(screen.getByRole('region', { name: 'What it changes in your plan' })).toHaveTextContent(/Trees/)
  })

  it('unknownCompanyShowsNotFound', () => {
    renderAt('/companies/nope')
    expect(screen.getByRole('heading', { name: 'Company not found' })).toBeInTheDocument()
  })
})
