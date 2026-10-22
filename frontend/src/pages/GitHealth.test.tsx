import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import GitHealth from './GitHealth'

afterEach(() => localStorage.clear())

describe('Repo health page', () => {
  it('asksForARepositoryBeforeChecking', () => {
    render(<TooltipProvider><MemoryRouter><GitHealth /></MemoryRouter></TooltipProvider>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Repository health')
    expect(screen.getByRole('textbox', { name: /GitHub repository/i })).toBeInTheDocument()
  })
})
