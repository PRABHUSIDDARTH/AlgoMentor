import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SiteNav } from './SiteNav'

function Probe() {
  return <p data-testid="at">{useLocation().pathname}</p>
}

function renderAt(path: string, props: Parameters<typeof SiteNav>[0] = {}) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <SiteNav {...props} />
        <Routes><Route path="*" element={<Probe />} /></Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}

describe('SiteNav', () => {
  it('marks the current section and tab', () => {
    renderAt('/learn/cn/tcp-udp')
    const sections = screen.getByRole('navigation', { name: 'Sections' })
    expect(within(sections).getByRole('link', { name: 'Learn' })).toHaveAttribute('aria-current', 'page')
    expect(within(sections).getByRole('link', { name: 'Practice' })).not.toHaveAttribute('aria-current')
    const tabs = screen.getByRole('navigation', { name: 'Learn pages' })
    expect(within(tabs).getByRole('link', { name: 'Networks' })).toHaveAttribute('aria-current', 'page')
    expect(within(tabs).getByRole('link', { name: 'OOP' })).not.toHaveAttribute('aria-current')
  })

  it('shows the Git tabs on the repo health page', () => {
    renderAt('/git/health')
    const tabs = screen.getByRole('navigation', { name: 'Git pages' })
    expect(within(tabs).getByRole('link', { name: 'Repo health' })).toHaveAttribute('aria-current', 'page')
    expect(within(tabs).getByRole('link', { name: 'Challenges' })).not.toHaveAttribute('aria-current')
  })

  it('navigates through the router on a section click', async () => {
    renderAt('/today')
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Sections' })).getByRole('link', { name: 'Git' }))
    expect(screen.getByTestId('at')).toHaveTextContent('/git')
  })

  it('has the search, theme and settings controls where asked', () => {
    renderAt('/app', { onJump: () => {} })
    expect(screen.getAllByRole('button', { name: 'Jump to problem' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('lists every page in the mobile menu', async () => {
    renderAt('/today')
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
    const menu = await screen.findByRole('dialog')
    for (const name of ['Workspace', 'Roadmap', 'Today', 'Tests', 'Overview', 'OOP', 'Networks', 'DBMS', 'Projects', 'Challenges', 'Repo health', 'DSA level', 'Core CS level', 'Resume projects']) {
      expect(within(menu).getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('shows page links, not sections, on the landing page', () => {
    renderAt('/', { landing: true })
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Page' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /pages$/ })).toBeNull()
  })
})
