import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GIT_CHALLENGES, GIT_CHALLENGE_BY_ID } from './git-challenges'
import { CHALLENGE_IDS, CHALLENGE_TITLES } from './types'

const PUBLIC = resolve(__dirname, '../../../public/git-challenges')

describe('git challenges content', () => {
  it('tenChallengesInSpecOrder', () => {
    expect(GIT_CHALLENGES.map((c) => c.id)).toEqual([...CHALLENGE_IDS])
    expect(GIT_CHALLENGES.map((c) => c.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(GIT_CHALLENGE_BY_ID.get('squash')?.title).toBe('Squash with interactive rebase')
  })

  it('titlesMatchTheSharedTitles', () => {
    for (const c of GIT_CHALLENGES) expect(c.title, c.id).toBe(CHALLENGE_TITLES[c.id])
  })

  it('everyChallengeIsFullyWritten', () => {
    for (const c of GIT_CHALLENGES) {
      expect(c.brief.length, c.id).toBeGreaterThan(80)
      expect(c.steps.length, c.id).toBeGreaterThanOrEqual(3)
      expect(c.cheatSheet.length, c.id).toBeGreaterThanOrEqual(3)
      for (const row of c.cheatSheet) expect(row.command.startsWith('git ') && row.what.length > 8, `${c.id}: ${row.command}`).toBe(true)
      expect(c.passesWhen.length, c.id).toBeGreaterThan(30)
    }
  })

  it('helpOnlyLinksToTheOfficialGitDocs', () => {
    for (const c of GIT_CHALLENGES) {
      expect(c.docs.length, c.id).toBeGreaterThanOrEqual(1)
      for (const d of c.docs) expect(d.url, `${c.id}: ${d.label}`).toMatch(/^https:\/\/git-scm\.com\//)
    }
  })

  it('theSixScriptedChallengesPointAtRealScripts', () => {
    const scripted = GIT_CHALLENGES.filter((c) => c.script).map((c) => c.id)
    expect(scripted).toEqual(['merge-conflict', 'squash', 'revert', 'rescue-branch', 'cherry-pick', 'remove-secret'])
    for (const c of GIT_CHALLENGES.filter((x) => x.script)) {
      expect(existsSync(resolve(PUBLIC, `${c.script}.sh`)), `${c.script}.sh`).toBe(true)
      expect(existsSync(resolve(PUBLIC, `${c.script}.ps1`)), `${c.script}.ps1`).toBe(true)
    }
  })

  it('briefsNameTheExactThingTheCheckLooksFor', () => {
    const text = (id: string) => GIT_CHALLENGE_BY_ID.get(id as never)!.passesWhen
    expect(text('squash')).toContain('feature/squash')
    expect(text('squash')).toContain('Add squash feature')
    expect(text('rescue-branch')).toContain('feature/rescue')
    expect(text('release')).toMatch(/annotated/i)
    expect(text('remove-secret')).toContain('config/secret.key')
    expect(text('merge-conflict')).toContain('conflict.txt')
    expect(text('cherry-pick')).toContain('welcome.txt')
  })
})
