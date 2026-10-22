import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkKey, GIT_EVENT, GIT_KEY, linkRepo, loadGit, parseRepoUrl, recordCheck, unlinkRepo } from './repos'

const NOW = new Date(2026, 9, 22, 10).getTime()
const LATER = NOW + 3 * 86_400_000

afterEach(() => localStorage.clear())

describe('parseRepoUrl', () => {
  it('parsesRepoUrlVariants', () => {
    const variants = [
      'https://github.com/ana/library',
      'https://github.com/ana/library/',
      'https://github.com/ana/library.git',
      'http://github.com/ana/library',
      'https://www.github.com/ana/library',
      'github.com/ana/library',
      'git@github.com:ana/library.git',
      'git@github.com:ana/library',
      'ssh://git@github.com/ana/library.git',
      'https://github.com/ana/library/tree/main',
      'https://github.com/ana/library/tree/feature/search?tab=readme',
      'https://github.com/ana/library/pull/3#issuecomment-1',
      '  https://github.com/ana/library  ',
    ]
    for (const input of variants) expect(parseRepoUrl(input), input).toEqual({ owner: 'ana', repo: 'library' })
    expect(parseRepoUrl('https://github.com/Ana/Library')).toEqual({ owner: 'Ana', repo: 'Library' })
  })

  it('keepsDotsAndUnderscoresInRepoNames', () => {
    expect(parseRepoUrl('https://github.com/ana/my_app.v2')).toEqual({ owner: 'ana', repo: 'my_app.v2' })
    expect(parseRepoUrl('https://github.com/ana/site.github.io.git')).toEqual({ owner: 'ana', repo: 'site.github.io' })
  })

  it('anythingElseGetsAFormatError', () => {
    for (const input of ['', '   ', 'ana/library', 'https://gitlab.com/ana/library', 'https://github.com/ana', 'https://github.com/', 'https://github.com/ana/..', 'https://github.com/an a/library', 'not a url', 'https://evil.com/github.com/ana/library', 'https://github.com.evil.com/ana/library', 'javascript:alert(1)']) {
      const got = parseRepoUrl(input)
      expect(got, input).toEqual({ error: 'Use a repository link like https://github.com/you/your-repo.' })
    }
  })
})

describe('git store', () => {
  it('linkRepoReplacesTheProjectsRepoAndAnnounces', () => {
    const seen = vi.fn()
    window.addEventListener(GIT_EVENT, seen)
    linkRepo('library-manager', 'ana', 'library')
    window.removeEventListener(GIT_EVENT, seen)
    expect(loadGit().repos['library-manager']).toMatchObject({ owner: 'ana', repo: 'library' })
    expect(seen).toHaveBeenCalledTimes(1)
  })

  it('recordCheckKeepsTheFirstPassDate', () => {
    const key = checkKey('library-manager', 'first-commit')
    recordCheck(key, { passed: true, details: [{ ok: true, text: 'README found' }] }, NOW)
    recordCheck(key, { passed: true, details: [{ ok: true, text: 'README found' }] }, LATER)
    const r = loadGit().checks[key]
    expect(r).toMatchObject({ passed: true, passedAt: NOW, checkedAt: LATER })
  })

  it('aLaterFailureKeepsTheEarlierPass', () => {
    const key = checkKey('library-manager', 'first-commit')
    recordCheck(key, { passed: true, details: [{ ok: true, text: 'ok' }] }, NOW)
    recordCheck(key, { error: 'Make the repository public to verify it.' }, LATER)
    expect(loadGit().checks[key]).toMatchObject({ passed: false, passedAt: NOW, checkedAt: LATER, error: 'Make the repository public to verify it.' })
  })

  it('relinkingADifferentRepoForgetsItsOldChecks', () => {
    linkRepo('library-manager', 'ana', 'library')
    const key = checkKey('library-manager', 'first-commit')
    recordCheck(key, { passed: true, details: [] }, NOW)
    linkRepo('library-manager', 'ANA', 'Library') // same repo, different case: keep
    expect(loadGit().checks[key]).toBeDefined()
    linkRepo('library-manager', 'ana', 'other')
    expect(loadGit().checks[key]).toBeUndefined()
  })

  it('unlinkKeepsPassRecords', () => {
    linkRepo('library-manager', 'ana', 'library')
    const key = checkKey('library-manager', 'first-commit')
    recordCheck(key, { passed: true, details: [] }, NOW)
    unlinkRepo('library-manager')
    expect(loadGit().repos['library-manager']).toBeUndefined()
    expect(loadGit().checks[key]?.passedAt).toBe(NOW)
  })

  it('ignoresMalformedRecords', () => {
    localStorage.setItem(GIT_KEY, JSON.stringify({
      repos: { good: { owner: 'ana', repo: 'library', linkedAt: 1 }, bad: { owner: 5 }, worse: { owner: 'a b', repo: 'x', linkedAt: 1 } },
      checks: {
        'good:first-commit': { passed: true, passedAt: 1, checkedAt: 2, details: [{ ok: true, text: 'x' }] },
        'good:not-a-challenge': { passed: true, checkedAt: 2, details: [] },
        'good:release': { passed: 'yes', checkedAt: 2, details: [] },
        'good:squash': { passed: false, checkedAt: 2, details: [{ ok: 'no' }] },
      },
    }))
    const g = loadGit()
    expect(Object.keys(g.repos)).toEqual(['good'])
    expect(Object.keys(g.checks)).toEqual(['good:first-commit'])
  })

  it('corruptStorageIsEmpty', () => {
    localStorage.setItem(GIT_KEY, '[1,2')
    expect(loadGit()).toEqual({ repos: {}, checks: {} })
    localStorage.setItem(GIT_KEY, '"x"')
    expect(loadGit()).toEqual({ repos: {}, checks: {} })
  })
})
