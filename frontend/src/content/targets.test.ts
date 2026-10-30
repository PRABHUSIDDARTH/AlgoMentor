import { describe, expect, it } from 'vitest'
import { STAGES } from '@/content/roadmap'
import { CORE_BAR, READINESS_BAR, ROLE_LABEL, ROLE_MULTIPLIER, TIER_LABEL, targetName, TARGET_WEIGHTS, weightsFor } from './targets'

const TIERS = ['maang', 'product', 'startup', 'service'] as const

describe('targets', () => {
  it('namesEveryTierAndLevel', () => {
    expect(TIER_LABEL).toEqual({ maang: 'MAANG', product: 'Big tech and product', startup: 'Startups', service: 'Service and IT consulting' })
    expect(ROLE_LABEL).toEqual({ intern: 'Intern', sde1: 'SDE-1', sde2: 'SDE-2', sde3: 'Senior SDE' })
  })

  it('hasABarAndAMultiplierForEveryTierAndLevel', () => {
    for (const t of TIERS) {
      expect(CORE_BAR[t]).toBeGreaterThan(0)
      for (const r of ['intern', 'sde1', 'sde2', 'sde3'] as const) expect(READINESS_BAR[t][r], `${t} ${r}`).toBeGreaterThan(0)
    }
    expect(ROLE_MULTIPLIER.sde3).toBeGreaterThan(ROLE_MULTIPLIER.sde2)
  })

  it('barsRiseWithLevelAndFallFromMaangToService', () => {
    for (const t of TIERS) {
      const b = READINESS_BAR[t]
      expect(b.intern).toBeLessThan(b.sde1)
      expect(b.sde1).toBeLessThan(b.sde2)
      expect(b.sde2).toBeLessThan(b.sde3)
    }
    for (const r of ['intern', 'sde1', 'sde2', 'sde3'] as const) {
      expect(READINESS_BAR.maang[r]).toBeGreaterThan(READINESS_BAR.product[r])
      expect(READINESS_BAR.product[r]).toBeGreaterThan(READINESS_BAR.startup[r])
      expect(READINESS_BAR.startup[r]).toBeGreaterThan(READINESS_BAR.service[r])
    }
  })

  it('weightsCoverEveryStageForEveryTier', () => {
    for (const t of TIERS) for (const s of STAGES) expect([0, 1, 2, 3], `${t} ${s.id}`).toContain(TARGET_WEIGHTS[t][s.id])
  })

  it('weightsForUsesTheTierWhenNoEmployerIsChosen', () => {
    expect(weightsFor({ company: 'service', role: 'sde1' })).toEqual(TARGET_WEIGHTS.service)
  })

  it('weightsForLetsAnEmployerOverrideTheTier', () => {
    const meta = weightsFor({ company: 'maang', role: 'sde1', employer: 'meta' })
    expect(meta.trees).toBe(3)
    expect(meta.recursion).toBe(3)
    // Stages Meta's guide says nothing about keep the tier's weight.
    const tier = TARGET_WEIGHTS.maang
    expect(meta.tries).toBe(tier.tries)
  })

  it('weightsForIgnoresAnEmployerThatDoesNotMatchTheTier', () => {
    expect(weightsFor({ company: 'service', role: 'sde1', employer: 'meta' })).toEqual(TARGET_WEIGHTS.service)
  })

  it('aDirectoryCompanyWithoutAVerifiedProcessUsesTheTierWeights', () => {
    expect(weightsFor({ company: 'product', role: 'sde1', employer: 'flipkart' })).toEqual(TARGET_WEIGHTS.product)
    expect(targetName({ company: 'product', role: 'sde1', employer: 'flipkart' })).toBe('Flipkart')
  })

  it('targetNameUsesTheEmployerOtherwiseTheTier', () => {
    expect(targetName({ company: 'maang', role: 'sde1' })).toBe('MAANG')
    expect(targetName({ company: 'maang', role: 'sde1', employer: 'meta' })).toBe('Meta')
    expect(targetName({ company: 'service', role: 'sde1', employer: 'meta' })).toBe('Service and IT consulting')
  })
})
