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

  it('has the search and theme controls where asked, and About as a section', () => {
    renderAt('/app', { onJump: () => {} })
    expect(screen.getAllByRole('button', { name: 'Jump to problem' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull()
    expect(within(screen.getByRole('navigation', { name: 'Sections' })).getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
  })

  it('shows the About tabs on the settings page', () => {
    renderAt('/about/settings')
    const tabs = screen.getByRole('navigation', { name: 'About pages' })
    expect(within(tabs).getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page')
    expect(within(tabs).getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current')
  })

  it('shows the gooey navigation on every screen size, with no separate menu button', () => {
    renderAt('/today')
    expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Practice pages' })).toBeInTheDocument()
  })

  it('shows page links, not sections, on the landing page', () => {
    renderAt('/', { landing: true })
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Page' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /pages$/ })).toBeNull()
  })
})
