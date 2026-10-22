import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Callout as CalloutData } from '@/learn/lessonBlocks'
import { Callout } from './Callout'

const html = (h: string) => [{ kind: 'html' as const, html: h }]
const make = (over: Partial<CalloutData> = {}): CalloutData => ({ kind: 'key', title: 'Key idea', body: html('<p>Bundle state and behaviour.</p>'), ...over })

describe('Callout', () => {
  it('showsItsTitleAndBodyAsANote', () => {
    render(<Callout callout={make()} />)
    const note = screen.getByRole('note', { name: 'Key idea' })
    expect(note).toHaveTextContent('Bundle state and behaviour.')
    expect(note).toHaveAttribute('data-kind', 'key')
  })

  it('rendersCodeSegmentsAsHighlightedCode', () => {
    render(<Callout callout={make({ kind: 'try', title: 'What prints?', body: [{ kind: 'code', lang: 'java', code: 'System.out.println(1 + 1);' }], answer: html('<p>It prints 2.</p>') })} />)
    expect(screen.getByText(/System\.out\.println/)).toBeInTheDocument()
  })

  it('hidesTheAnswerUntilTheLearnerAsks', async () => {
    render(<Callout callout={make({ kind: 'try', title: 'What prints?', answer: html('<p>It prints 2.</p>') })} />)
    const button = screen.getByRole('button', { name: 'Show the answer' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('It prints 2.')).not.toBeVisible()
    await userEvent.click(button)
    expect(screen.getByRole('button', { name: 'Hide the answer' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('It prints 2.')).toBeVisible()
  })

  it('hasNoAnswerButtonOnOtherKinds', () => {
    render(<Callout callout={make({ kind: 'gotcha', title: 'Common mistake' })} />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
