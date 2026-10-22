import { describe, expect, it } from 'vitest'
import { TRACKS } from '@/content/learn'
import { SECTIONS, sectionFor, sectionTabs, tabFor } from './sections'

const CASES: [string, string, string][] = [
  ['/app', 'practice', '/app'],
  ['/roadmap', 'practice', '/roadmap'],
  ['/roadmap/arrays', 'practice', '/roadmap'],
  ['/today', 'practice', '/today'],
  ['/tests', 'practice', '/tests'],
  ['/test/abc', 'practice', '/tests'],
  ['/learn', 'learn', '/learn'],
  ['/learn/oop', 'learn', '/learn/oop'],
  ['/learn/cn/tcp-udp', 'learn', '/learn/cn'],
  ['/projects', 'learn', '/projects'],
  ['/projects/library-manager', 'learn', '/projects'],
  ['/git', 'git', '/git'],
  ['/git/squash', 'git', '/git'],
  ['/git/health', 'git', '/git/health'],
  ['/level', 'progress', '/level'],
  ['/level/core', 'progress', '/level/core'],
  ['/resume', 'progress', '/resume'],
  ['/companies', 'progress', '/companies'],
  ['/companies/meta', 'progress', '/companies'],
]

describe('sections', () => {
  it.each(CASES)('%s is in %s under tab %s', (path, section, tab) => {
    expect(sectionFor(path)).toBe(section)
    expect(tabFor(path)?.to).toBe(tab)
  })

  it('has no section for the landing page or unknown paths', () => {
    expect(sectionFor('/')).toBeNull()
    expect(sectionFor('/nope')).toBeNull()
    expect(tabFor('/')).toBeNull()
  })

  it('keeps the right section highlighted on a not-found page inside it', () => {
    for (const [path, section] of [['/learn/nope', 'learn'], ['/level/nope', 'progress'], ['/learn/os/nope/deeper', 'learn'], ['/test', 'practice'], ['/companies/nope/x', 'progress']] as const) {
      expect(sectionFor(path), path).toBe(section)
    }
    expect(tabFor('/learn/nope')).toBeNull()
  })

  it('does not match on a shared prefix', () => {
    expect(sectionFor('/learnings')).toBeNull()
    expect(sectionFor('/github')).toBeNull()
  })

  it('lists one Learn tab per track', () => {
    const tos = sectionTabs('learn').map((t) => t.to)
    for (const t of TRACKS) expect(tos).toContain(`/learn/${t.id}`)
  })

  it('has four sections and no route in two tabs', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['practice', 'learn', 'git', 'progress'])
    const all = SECTIONS.flatMap((s) => sectionTabs(s.id).map((t) => t.to))
    expect(new Set(all).size).toBe(all.length)
  })
})
