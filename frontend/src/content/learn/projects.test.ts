import { describe, expect, it } from 'vitest'
import { PROJECTS, PROJECT_BY_ID } from './projects'
import { TRACKS } from '.'

const ALL_CHALLENGES = ['first-commit', 'meaningful-commits', 'feature-pr', 'merge-conflict', 'squash', 'revert', 'rescue-branch', 'cherry-pick', 'release', 'remove-secret']

describe('projects content', () => {
  it('nineProjectsThreePerTrackBeginnerToAdvanced', () => {
    expect(PROJECTS).toHaveLength(9)
    for (const t of TRACKS) {
      const mine = PROJECTS.filter((p) => p.track === t.id)
      expect(mine.map((p) => p.level), t.id).toEqual(['beginner', 'intermediate', 'advanced'])
      expect(t.projects, t.id).toEqual(mine.map((p) => p.id))
    }
  })

  it('specExamplesAreThere', () => {
    expect(PROJECTS.map((p) => p.id)).toEqual(['library-manager', 'parking-lot', 'expense-splitter', 'tcp-chat', 'http-server', 'dns-resolver', 'ecommerce-schema', 'kv-store', 'bplus-index'])
  })

  it('everyProjectIsFullySpecified', () => {
    for (const p of PROJECTS) {
      expect(p.goal.length, p.id).toBeGreaterThan(60)
      expect(p.proves.length, p.id).toBeGreaterThanOrEqual(2)
      expect(p.requirements.length, p.id).toBeGreaterThanOrEqual(5)
      expect(p.stretch.length, p.id).toBeGreaterThanOrEqual(2)
      expect(p.acceptance.length, p.id).toBeGreaterThanOrEqual(5)
      expect(p.stack.length, p.id).toBeGreaterThan(10)
      expect(p.gitMilestones.length, p.id).toBe(3 + (p.id === 'library-manager' ? 1 : 0))
      expect(new Set(p.gitMilestones).size, p.id).toBe(p.gitMilestones.length)
      for (const m of p.gitMilestones) expect(ALL_CHALLENGES, `${p.id} milestone ${m}`).toContain(m)
    }
  })

  it('everyGitChallengeBelongsToSomeProject', () => {
    const used = new Set(PROJECTS.flatMap((p) => p.gitMilestones))
    for (const c of ALL_CHALLENGES) expect(used.has(c as never), c).toBe(true)
  })

  it('idsAreUniqueAndLookupWorks', () => {
    expect(new Set(PROJECTS.map((p) => p.id)).size).toBe(PROJECTS.length)
    expect(PROJECT_BY_ID.get('parking-lot')?.title).toBe('Parking lot system')
  })

  it('projectsDoNotAskForLeetCodeCredentialsOrAi', () => {
    const text = JSON.stringify(PROJECTS).toLowerCase()
    expect(text).not.toMatch(/password|cookie|api key/)
  })
})
