import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressRing } from './ProgressRing'

describe('ProgressRing', () => {
  it('describesProgressInWords', () => {
    render(<ProgressRing done={3} total={10} label="OOP" />)
    expect(screen.getByRole('img', { name: 'OOP: 3 of 10 modules complete' })).toBeInTheDocument()
    expect(screen.getByText('3/10')).toBeInTheDocument()
  })

  it('fillsInProportion', () => {
    const { container } = render(<ProgressRing done={5} total={10} label="x" />)
    const arc = container.querySelector('[data-part="arc"]')!
    const r = Number(arc.getAttribute('r'))
    const c = 2 * Math.PI * r
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(c / 2, 1)
  })

  it('emptyAndFullAreSafe', () => {
    const { container, rerender } = render(<ProgressRing done={0} total={0} label="x" />)
    const arc = () => container.querySelector('[data-part="arc"]')!
    expect(Number.isFinite(Number(arc().getAttribute('stroke-dashoffset')))).toBe(true)
    rerender(<ProgressRing done={10} total={10} label="x" />)
    expect(Number(arc().getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 5)
  })
})
