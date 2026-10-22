import { describe, expect, it } from 'vitest'
import { RESUME_PROJECTS, matchesFilter } from './resume-projects'

const COMPANIES = ['maang', 'startup', 'service'] as const
const ROLES = ['intern', 'sde1', 'sde2'] as const

describe('resume projects content', () => {
  it('twelveProjectsWithUniqueIds', () => {
    expect(RESUME_PROJECTS).toHaveLength(12)
    expect(new Set(RESUME_PROJECTS.map((p) => p.id)).size).toBe(12)
  })

  it('specExamplesAreThere', () => {
    const ids = RESUME_PROJECTS.map((p) => p.id)
    for (const id of ['collab-editor', 'url-shortener', 'rate-limiter', 'job-queue', 'search-engine', 'payments-ledger', 'mini-git', 'code-runner']) expect(ids).toContain(id)
  })

  it('everyProjectIsFullyWritten', () => {
    for (const p of RESUME_PROJECTS) {
      expect(p.proves.length, p.id).toBeGreaterThan(40)
      expect(p.core.length, p.id).toBeGreaterThanOrEqual(4)
      expect(p.stretch.length, p.id).toBeGreaterThanOrEqual(2)
      expect(p.stack.length, p.id).toBeGreaterThan(10)
      expect(p.targets.length, p.id).toBeGreaterThanOrEqual(1)
      expect(p.roles.length, p.id).toBeGreaterThanOrEqual(1)
    }
  })

  it('bulletTemplateHasPlaceholdersAndExampleHasNumbers', () => {
    for (const p of RESUME_PROJECTS) {
      expect(p.bullet.template, p.id).toMatch(/<[^>]+>/)
      expect(p.bullet.example, p.id).toMatch(/\d/)
      expect(p.bullet.example, p.id).not.toMatch(/<[^>]+>/)
      expect(p.bullet.example.length, p.id).toBeLessThanOrEqual(260)
    }
  })

  it('everyTargetAndRoleHasAtLeastTwoProjects', () => {
    for (const c of COMPANIES) {
      for (const r of ROLES) {
        const n = RESUME_PROJECTS.filter((p) => matchesFilter(p, c, r)).length
        expect(n, `${c} / ${r}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('matchesFilterTreatsAllAsAnything', () => {
    const p = RESUME_PROJECTS[0]
    expect(matchesFilter(p, 'all', 'all')).toBe(true)
    expect(RESUME_PROJECTS.filter((x) => matchesFilter(x, 'all', 'all'))).toHaveLength(12)
  })
})
