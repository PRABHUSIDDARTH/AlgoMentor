import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CheckResultView } from './CheckResultView'

describe('CheckResultView', () => {
  it('announcesResultsToScreenReaders', () => {
    const { rerender } = render(<CheckResultView />)
    const region = screen.getByRole('status')
    expect(region).toHaveTextContent('Not checked')
    // The live region exists before the result arrives, so the change is announced.
    rerender(<CheckResultView record={{ checkedAt: 1, passed: true, passedAt: new Date(2026, 9, 1).getTime(), details: [{ ok: true, text: 'README found' }] }} />)
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent('Passed Oct 1')
    expect(region).toHaveTextContent('README found')
  })

  it('announcesAnErrorToo', () => {
    render(<CheckResultView record={{ checkedAt: 1, passed: false, details: [], error: 'Make the repository public to verify it.' }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Make the repository public to verify it.')
  })
})
