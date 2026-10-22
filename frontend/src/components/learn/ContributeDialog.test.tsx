import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, saveSettings } from '@/practice/store'
import { ContributeDialog } from './ContributeDialog'

const api = vi.hoisted(() => ({ submitContribution: vi.fn() }))
vi.mock('@/lib/api', async (orig) => ({ ...(await orig<typeof import('@/lib/api')>()), ...api }))
const { ApiError } = await import('@/lib/api')

async function open() {
  render(<ContributeDialog />)
  await userEvent.click(screen.getByRole('button', { name: 'Share the project that got you in' }))
  return screen.getByRole('dialog', { name: 'Share the project that got you in' })
}

async function fillRequired() {
  await userEvent.type(screen.getByRole('textbox', { name: 'Company' }), 'Atlassian')
  await userEvent.type(screen.getByRole('textbox', { name: 'Role title' }), 'Software Engineer, Backend')
  await userEvent.type(screen.getByRole('textbox', { name: 'Project name' }), 'Seat reservation system')
  await userEvent.type(screen.getByRole('textbox', { name: 'What you built' }), 'A booking API where one seat can never be sold twice, with expiring holds.')
  await userEvent.type(screen.getByRole('textbox', { name: 'How it helped you get in' }), 'I walked through the unique constraint and the hold expiry in system design.')
  await userEvent.type(screen.getByRole('textbox', { name: 'Stack' }), 'Spring Boot, PostgreSQL')
}

beforeEach(() => api.submitContribution.mockResolvedValue({ id: 'abc' }))
afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  api.submitContribution.mockReset()
})

describe('ContributeDialog', () => {
  it('explainsThatEntriesAreReviewedAndNotVerified', async () => {
    const dialog = await open()
    expect(dialog).toHaveTextContent(/reviewed before anything is published/i)
    expect(dialog).toHaveTextContent(/not verified/i)
  })

  it('prefillsNameLinkedInEmailAndLevelFromYourProfile', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, name: 'Ana Gomez', linkedin: 'ana-gomez', email: 'ana@example.com', target: { company: 'maang', role: 'sde2' } })
    await open()
    expect(screen.getByRole('textbox', { name: 'Your name (shown if approved)' })).toHaveValue('Ana Gomez')
    expect(screen.getByRole('textbox', { name: 'LinkedIn profile name (shown if approved)' })).toHaveValue('ana-gomez')
    expect(screen.getByRole('textbox', { name: 'Email (never shown)' })).toHaveValue('ana@example.com')
    expect(screen.getByRole('combobox', { name: 'Level' })).toHaveValue('sde2')
  })

  it('wontSubmitWithoutConsentAndTheRequiredFields', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Send for review' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/fill in/i)
    expect(api.submitContribution).not.toHaveBeenCalled()
    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: 'Send for review' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/agree/i)
    expect(api.submitContribution).not.toHaveBeenCalled()
  })

  it('sendsTheFormAndThanksThem', async () => {
    await open()
    await fillRequired()
    await userEvent.click(screen.getByRole('checkbox', { name: /I agree/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Send for review' }))
    expect(api.submitContribution).toHaveBeenCalledWith(expect.objectContaining({ company: 'Atlassian', level: 'sde1', projectTitle: 'Seat reservation system', consent: true, website: '' }), expect.anything())
    expect(await screen.findByRole('status')).toHaveTextContent(/Thank you/)
  })

  it('showsTheServersReasonWhenItIsRejected', async () => {
    api.submitContribution.mockRejectedValue(new ApiError(400, 'summary must be 40 to 1200 characters.'))
    await open()
    await fillRequired()
    await userEvent.click(screen.getByRole('checkbox', { name: /I agree/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Send for review' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('summary must be 40 to 1200 characters.')
  })

  it('hasAHoneypotFieldThatPeopleDoNotSee', async () => {
    await open()
    const trap = document.querySelector('input[name="website"]') as HTMLInputElement
    expect(trap).not.toBeNull()
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(trap.tabIndex).toBe(-1)
  })
})
