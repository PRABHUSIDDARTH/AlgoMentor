import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PROJECTS } from '@/content/learn/projects'
import { TRACKS } from '@/content/learn'
import { GIT_KEY } from '@/learn/repos'
import Projects from './Projects'

afterEach(() => localStorage.clear())

describe('Projects page', () => {
  it('groupsEveryProjectUnderItsTrack', () => {
    render(<TooltipProvider><MemoryRouter><Projects /></MemoryRouter></TooltipProvider>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Projects')
    for (const t of TRACKS) {
      const group = screen.getByRole('list', { name: `${t.title} projects` })
      const mine = PROJECTS.filter((p) => p.track === t.id)
      expect(within(group).getAllByRole('listitem')).toHaveLength(mine.length)
      for (const p of mine) expect(within(group).getByRole('link', { name: p.title })).toHaveAttribute('href', `/projects/${p.id}`)
    }
  })

  it('showsGitMilestoneProgress', () => {
    const p = PROJECTS[0]
    const checks = Object.fromEntries(p.gitMilestones.slice(0, 1).map((m) => [`${p.id}:${m}`, { checkedAt: 1, passed: true, details: [], passedAt: 1 }]))
    localStorage.setItem(GIT_KEY, JSON.stringify({ repos: {}, checks }))
    render(<TooltipProvider><MemoryRouter><Projects /></MemoryRouter></TooltipProvider>)
    expect(screen.getByText(`1 of ${p.gitMilestones.length} Git milestones`)).toBeInTheDocument()
  })
})
