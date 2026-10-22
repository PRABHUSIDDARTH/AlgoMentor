import { describe, expect, it } from 'vitest'
import { COMPANIES } from './companies'
import { COUNTRIES, DIRECTORY, directoryEntry } from './directory'
import { LOGOS } from './logos'

describe('company directory', () => {
  it('coversIndiaAndTheMainMarkets', () => {
    expect(DIRECTORY.length).toBeGreaterThanOrEqual(200)
    expect(DIRECTORY.filter((d) => d.country === 'IN').length).toBeGreaterThanOrEqual(50)
    expect(new Set(DIRECTORY.map((d) => d.country)).size).toBeGreaterThanOrEqual(20)
    for (const t of ['maang', 'product', 'startup', 'service'] as const) expect(DIRECTORY.filter((d) => d.tier === t).length, t).toBeGreaterThanOrEqual(5)
  })

  it('hasUniqueUrlSafeIdsAndKnownCountries', () => {
    const ids = DIRECTORY.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(DIRECTORY.map((d) => d.name.toLowerCase())).size).toBe(ids.length)
    for (const d of DIRECTORY) {
      expect(d.id).toMatch(/^[a-z0-9-]{1,40}$/)
      expect(Object.keys(COUNTRIES)).toContain(d.country)
      expect(d.sector.length, d.id).toBeGreaterThan(2)
    }
  })

  it('maangIsExactlyTheFiveCompanies', () => {
    expect(DIRECTORY.filter((d) => d.tier === 'maang').map((d) => d.name).sort()).toEqual(['Amazon', 'Apple', 'Google', 'Meta', 'Netflix'])
  })

  it('everyVerifiedProfileIsInTheDirectoryWithTheSameTier', () => {
    for (const c of COMPANIES) expect(directoryEntry(c.id)?.tier, c.id).toBe(c.tier)
  })

  it('logosOnlyExistForDirectoryCompaniesAndAreWellFormed', () => {
    for (const [id, logo] of Object.entries(LOGOS)) {
      expect(directoryEntry(id), id).toBeDefined()
      expect(logo.hex).toMatch(/^[0-9A-F]{6}$/i)
      expect(logo.path.length).toBeGreaterThan(10)
    }
  })
})
