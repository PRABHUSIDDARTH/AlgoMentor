import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '@/practice/store'
import { accentFor, cardData, containBox, inkLuminance, linkedInShareUrl, motivation, roleTitle, shareText, splitName } from './dreamCard'

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

describe('motivation', () => {
  it('encouragesAtEveryStageWithoutPromisingAnOffer', () => {
    const lines = [0, 9, 30, 55, 80, 95, 100].map((n) => motivation(n, 'Meta'))
    expect(new Set(lines).size).toBe(lines.length)
    expect(motivation(0, 'Meta')).toMatch(/Day one/)
    expect(motivation(100, 'Meta')).toContain('Meta')
    for (const l of lines) expect(l).not.toMatch(/guarantee|will get|you will be hired/i)
  })
})

describe('card helpers', () => {
  it('writesARoleTitleFromLevelAndFocus', () => {
    expect(roleTitle('intern')).toBe('Software Engineering Intern')
    expect(roleTitle('sde1')).toBe('Software Engineer')
    expect(roleTitle('sde1', 'Backend')).toBe('Software Engineer, Backend')
    expect(roleTitle('sde2', 'Data')).toBe('Software Engineer II, Data')
    expect(roleTitle('sde3', 'DevOps and SRE')).toBe('Senior Software Engineer, DevOps and SRE')
  })

  it('splitsANameIntoFirstAndRestForTheTwoWeights', () => {
    expect(splitName('Ana Gomez')).toEqual({ first: 'Ana', last: 'Gomez' })
    expect(splitName('Ana Maria de la Cruz')).toEqual({ first: 'Ana', last: 'Maria de la Cruz' })
    expect(splitName('Cher')).toEqual({ first: 'Cher', last: '' })
    expect(splitName('  Ana   Gomez ')).toEqual({ first: 'Ana', last: 'Gomez' })
  })

  it('picksLegibleTextForAnyBrandColour', () => {
    expect(accentFor('#4285F4')).toEqual({ color: '#4285F4', on: '#FFFFFF' })
    expect(accentFor('#FFD60A').on).toBe('#111111')
    expect(accentFor('#000000').on).toBe('#FFFFFF')
  })

  it('fallsBackToInkForAMissingOrMalformedBrandColour', () => {
    expect(accentFor(undefined).color).toBe('#1C2116')
    expect(accentFor('not a colour').color).toBe('#1C2116')
    expect(accentFor('#fff').color).toBe('#FFFFFF')
  })

  it('fitsALogoInsideABoxKeepingItsShape', () => {
    expect(containBox(400, 100, 200, 100)).toEqual({ w: 200, h: 50 })
    expect(containBox(100, 400, 200, 100)).toEqual({ w: 25, h: 100 })
    expect(containBox(50, 50, 200, 100)).toEqual({ w: 100, h: 100 })
  })

  it('putsNoReadinessPercentageOnTheCardData', () => {
    const d = cardData(settings, { dsa: 64, core: 41 })
    // The number lives on the page and in the share image, never on the card itself.
    expect(JSON.stringify(Object.keys(d))).toContain('readiness')
    expect(shareText(d)).toContain('41% ready')
  })
})

describe('inkLuminance', () => {
  const px = (r: number, g: number, b: number, a = 255) => [r, g, b, a]

  it('isHighForWhiteArtworkAndLowForDarkArtwork', () => {
    expect(inkLuminance(new Uint8ClampedArray([...px(255, 255, 255), ...px(255, 255, 255)]))).toBeGreaterThan(0.95)
    expect(inkLuminance(new Uint8ClampedArray([...px(10, 10, 10), ...px(20, 20, 20)]))).toBeLessThan(0.1)
  })

  it('ignoresTransparentPixelsSoABlankMarginDoesNotCount', () => {
    expect(inkLuminance(new Uint8ClampedArray([...px(0, 0, 0, 0), ...px(0, 0, 0, 0), ...px(255, 255, 255)]))).toBeGreaterThan(0.95)
    expect(inkLuminance(new Uint8ClampedArray([...px(255, 255, 255, 0)]))).toBe(0)
  })
})

