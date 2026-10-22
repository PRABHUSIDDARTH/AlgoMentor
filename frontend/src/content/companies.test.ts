import { describe, expect, it } from 'vitest'
import { STAGE_GROUP_IDS } from './stageGroups'
import { COMPANIES, companyById, companiesByTier, employerFor } from './companies'

describe('company dataset', () => {
  it('hasAtLeastOneCompanyInEveryTier', () => {
    for (const t of ['maang', 'product', 'startup', 'service'] as const) expect(companiesByTier(t).length, t).toBeGreaterThanOrEqual(1)
    expect(companiesByTier('maang').map((c) => c.name).sort()).toEqual(['Amazon', 'Apple', 'Google', 'Meta', 'Netflix'])
  })

  it('hasUniqueUrlSafeIds', () => {
    const ids = COMPANIES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{1,40}$/)
  })

  it('everyCompanyDescribesItsRoundsAndNamesItsSources', () => {
    for (const c of COMPANIES) {
      expect(c.rounds.length, c.id).toBeGreaterThanOrEqual(2)
      for (const r of c.rounds) {
        expect(r.name.length, `${c.id} round`).toBeGreaterThan(2)
        expect(r.detail.length, `${c.id} ${r.name}`).toBeGreaterThan(15)
      }
      expect(c.summary.length, c.id).toBeGreaterThan(30)
      expect(c.sources.length, c.id).toBeGreaterThanOrEqual(1)
      for (const s of c.sources) expect(s.url, `${c.id} source`).toMatch(/^https:\/\//)
      expect(c.checked, c.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('marksCompaniesWithoutAnOfficialPageAsReported', () => {
    const reported = COMPANIES.filter((c) => c.reported).map((c) => c.id)
    expect(reported).toEqual(['apple'])
    for (const c of COMPANIES.filter((x) => !x.reported)) expect(c.sources.some((s) => /careers|jobs|tcs\.com|infosys\.com|accenture\.com|capgemini\.com|atlassian\.com|razorpay\.com/.test(s.url)), c.id).toBe(true)
  })

  it('emphasisOnlyNamesRealStageGroupsWithValidWeights', () => {
    for (const c of COMPANIES) {
      for (const [g, w] of Object.entries(c.emphasis ?? {})) {
        expect(STAGE_GROUP_IDS, `${c.id} ${g}`).toContain(g)
        expect([0, 1, 2, 3]).toContain(w)
      }
    }
  })

  it('looksCompaniesUpByIdAndOnlyForTheirOwnTier', () => {
    expect(companyById('meta')?.name).toBe('Meta')
    expect(companyById('nope')).toBeUndefined()
    expect(employerFor({ company: 'maang', role: 'sde1', employer: 'meta' })?.name).toBe('Meta')
    expect(employerFor({ company: 'service', role: 'sde1', employer: 'meta' })).toBeUndefined()
    expect(employerFor({ company: 'maang', role: 'sde1' })).toBeUndefined()
  })
})
