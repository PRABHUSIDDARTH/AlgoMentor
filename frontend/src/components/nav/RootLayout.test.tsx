import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppShell } from '@/components/AppShell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RootLayout } from './RootLayout'

const Page = ({ name }: { name: string }) => <AppShell><h1>{name}</h1></AppShell>

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/today" element={<Page name="Today page" />} />
            <Route path="/git" element={<Page name="Git page" />} />
            <Route path="/git/health" element={<Page name="Health page" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )
}
describe('RootLayout', () => {
  it('keepsTheSameNavbarWhenNavigatingBetweenPages', async () => {
    renderAt('/today')
    const before = screen.getByRole('navigation', { name: 'Sections' })
    await userEvent.click(within(before).getByRole('link', { name: 'Git' }))
    expect(screen.getByRole('heading', { name: 'Git page' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBe(before)
  })

  it('keepsTheTabsRowAcrossPagesInTheSameSection', async () => {
    renderAt('/git')
    const tabs = screen.getByRole('navigation', { name: 'Git pages' })
    await userEvent.click(within(tabs).getByRole('link', { name: 'Repo health' }))
    expect(screen.getByRole('heading', { name: 'Health page' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Git pages' })).toBe(tabs)
  })

  it('rendersExactlyOneNavbarAndOneMainLandmark', () => {
    renderAt('/today')
    expect(screen.getAllByRole('navigation', { name: 'Sections' })).toHaveLength(1)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getAllByRole('link', { name: 'Skip to content' })).toHaveLength(1)
  })
})
