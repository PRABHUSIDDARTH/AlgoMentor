import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders breadcrumbs ending in the current page, the title and summary', () => {
    render(
      <MemoryRouter>
        <PageHeader eyebrow="Module 2 of 10" title="TCP and UDP" summary="Two transports." crumbs={[{ label: 'Learn', to: '/learn' }, { label: 'Networks', to: '/learn/cn' }, { label: 'TCP and UDP' }]}>
          <p>extra</p>
        </PageHeader>
      </MemoryRouter>,
    )
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getByRole('link', { name: 'Learn' })).toHaveAttribute('href', '/learn')
    expect(within(crumbs).getByRole('link', { name: 'Networks' })).toHaveAttribute('href', '/learn/cn')
    expect(within(crumbs).getByText('TCP and UDP')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1, name: 'TCP and UDP' })).toBeInTheDocument()
    expect(screen.getByText('Two transports.')).toBeInTheDocument()
    expect(screen.getByText('Module 2 of 10')).toBeInTheDocument()
    expect(screen.getByText('extra')).toBeInTheDocument()
  })

  it('omits the breadcrumb when there are none', () => {
    render(<MemoryRouter><PageHeader title="Today's plan" /></MemoryRouter>)
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
  })
})
