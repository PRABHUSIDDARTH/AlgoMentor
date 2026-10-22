import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '@/practice/store'
import { cardData, linkedInShareUrl, shareText } from './dreamCard'

const settings = { ...DEFAULT_SETTINGS, name: 'Ana Gomez', leetcode: 'ana', github: 'anagomez', linkedin: 'ana-gomez', target: { company: 'maang' as const, role: 'sde1' as const, employer: 'meta', focus: 'backend' as const } }

describe('cardData', () => {
  it('putsTheDreamCompanyLevelFocusAndReadinessOnTheCard', () => {
    const d = cardData(settings, { dsa: 64, core: 41 })
    expect(d).toMatchObject({ name: 'Ana Gomez', company: 'Meta', companyId: 'meta', role: 'SDE-1', focus: 'Backend', readiness: 41, dsa: 64, core: 41 })
    expect(d.handles).toEqual({ leetcode: 'ana', github: 'anagomez', linkedin: 'ana-gomez' })
  })

  it('fallsBackToTheTierAndAPlaceholderNameWhenNothingIsSet', () => {
    const d = cardData(DEFAULT_SETTINGS, { dsa: 10, core: 20 })
    expect(d).toMatchObject({ name: 'Your name', company: 'MAANG', companyId: undefined, readiness: 10, focus: undefined })
  })

  it('clampsReadinessToZeroToOneHundred', () => {
    expect(cardData(settings, { dsa: 140, core: 120 }).readiness).toBe(100)
    expect(cardData(settings, { dsa: -5, core: 3 }).readiness).toBe(0)
  })
})

describe('sharing', () => {
  it('writesAGoalNotAJobClaim', () => {
    const text = shareText(cardData(settings, { dsa: 64, core: 41 }))
    expect(text).toContain('working toward an SDE-1 role at Meta')
    expect(text).toContain('41% ready')
    expect(text).toContain('DSA 64%')
    expect(text).toContain('core CS 41%')
    expect(text).not.toMatch(/joined|hired|employee|I work at/i)
  })

  it('usesAForConsonantLevels', () => {
    const text = shareText(cardData({ ...settings, target: { ...settings.target, role: 'sde3' } }, { dsa: 1, core: 1 }))
    expect(text).toContain('working toward a Senior SDE role at Meta')
  })

  it('opensTheLinkedInComposerWithTheText', () => {
    const url = new URL(linkedInShareUrl('Hello & welcome'))
    expect(url.origin).toBe('https://www.linkedin.com')
    expect(url.pathname).toBe('/feed/')
    expect(url.searchParams.get('shareActive')).toBe('true')
    expect(url.searchParams.get('text')).toBe('Hello & welcome')
  })
})
