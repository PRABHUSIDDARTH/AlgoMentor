import { describe, expect, it } from 'vitest'
import { TRACKS } from '@/content/learn'
import { PROJECTS } from '@/content/learn/projects'
import { CHALLENGE_IDS } from '@/content/learn/types'
import { CORE_BAR } from '@/content/targets'
import { CORE_WEIGHTS, coreGaps, coreReadiness, coreScore, type CoreInput } from './coreReadiness'
import { checkKey, type CheckRecord, type GitState } from './repos'
import type { LearnProgress } from './progress'

const MAANG = { company: 'maang', role: 'sde1' } as const
const SERVICE = { company: 'service', role: 'sde1' } as const
const NO_GIT: GitState = { repos: {}, checks: {} }

const done = (best = 5) => ({ completedAt: 1, bestQuiz: best, reviewStep: 0, nextReviewAt: null })
const learnFor = (trackIds: string[], best = 5): LearnProgress =>
  Object.fromEntries(TRACKS.filter((t) => trackIds.includes(t.id)).flatMap((t) => t.modules.map((m) => [m.id, done(best)]))) as LearnProgress

const passed = (key: string): [string, CheckRecord] => [key, { checkedAt: 1, passed: true, passedAt: 1, details: [] }]
const gitWith = (keys: string[]): GitState => ({ repos: {}, checks: Object.fromEntries(keys.map(passed)) })
const input = (over: Partial<CoreInput> = {}): CoreInput => ({ learn: {}, git: NO_GIT, target: MAANG, ...over })

describe('coreScore', () => {
  it('weightsAndBars', () => {
    expect(CORE_WEIGHTS).toEqual({ modules: 40, quiz: 30, projects: 20, git: 10 })
    expect(Object.values(CORE_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100)
    expect(CORE_BAR).toEqual({ maang: 70, product: 65, startup: 60, service: 75 })
  })

  it('emptyIsZero', () => {
    const s = coreScore(input())
    expect(s.total).toBe(0)
    expect(coreReadiness(s.total, MAANG)).toBe(0)
  })

  it('everythingDoneIsAHundred', () => {
    const all = gitWith([...PROJECTS.flatMap((p) => p.gitMilestones.map((m) => checkKey(p.id, m)))])
    const s = coreScore(input({ learn: learnFor(['oop', 'cn', 'dbms', 'os']), git: all }))
    expect(s.parts.modules).toBeCloseTo(40)
    expect(s.parts.quiz).toBeCloseTo(30)
    expect(s.parts.projects).toBeCloseTo(20)
    expect(s.parts.git).toBeCloseTo(10)
    expect(s.total).toBeCloseTo(100)
  })

  it('modulesPartCountsOnlyCompletedModules', () => {
    const attemptedOnly: LearnProgress = { [TRACKS[0].modules[0].id]: { bestQuiz: 5, reviewStep: 0, nextReviewAt: null } }
    const s = coreScore(input({ learn: attemptedOnly }))
    expect(s.parts.modules).toBe(0)
    expect(s.parts.quiz).toBeCloseTo((5 / 200) * 30) // a quiz score still counts
  })

  it('serviceWeighsDbmsAndCnHigher', () => {
    const dbms = learnFor(['dbms'])
    const oop = learnFor(['oop'])
    const faangDbms = coreScore(input({ learn: dbms })).parts.modules
    const serviceDbms = coreScore(input({ learn: dbms, target: SERVICE })).parts.modules
    expect(faangDbms).toBeCloseTo(10)
    expect(serviceDbms).toBeCloseTo(12)
    expect(serviceDbms).toBeGreaterThan(faangDbms)
    expect(coreScore(input({ learn: oop, target: SERVICE })).parts.modules).toBeLessThan(coreScore(input({ learn: oop })).parts.modules)
    expect(coreScore(input({ learn: learnFor(['cn']), target: SERVICE })).parts.modules).toBeCloseTo(12)
  })

  it('aProjectCountsOnlyWhenEveryMilestoneIsPassed', () => {
    const lib = PROJECTS.find((p) => p.id === 'library-manager')!
    const partial = gitWith(lib.gitMilestones.slice(0, 3).map((m) => checkKey(lib.id, m)))
    expect(coreScore(input({ git: partial })).parts.projects).toBe(0)
    const full = gitWith(lib.gitMilestones.map((m) => checkKey(lib.id, m)))
    expect(coreScore(input({ git: full })).parts.projects).toBeCloseTo(20 / 12)
  })

  it('aPassKeptAfterTheRepoWentPrivateStillCounts', () => {
    const lib = PROJECTS.find((p) => p.id === 'library-manager')!
    const checks = Object.fromEntries(lib.gitMilestones.map((m) => [checkKey(lib.id, m), { checkedAt: 2, passed: false, passedAt: 1, details: [], error: 'Make the repository public to verify it.' }]))
    expect(coreScore(input({ git: { repos: {}, checks } })).parts.projects).toBeCloseTo(20 / 12)
  })

  it('gitChallengesCountOncePerChallengeAcrossScopes', () => {
    const git = gitWith([checkKey('library-manager', 'squash'), checkKey('practice', 'squash'), checkKey('tcp-chat', 'release')])
    expect(coreScore(input({ git })).parts.git).toBeCloseTo((2 / CHALLENGE_IDS.length) * 10)
  })

  it('quizPartIsTheMeanOverAllModules', () => {
    const s = coreScore(input({ learn: learnFor(['oop'], 4) }))
    expect(s.parts.quiz).toBeCloseTo((40 / 200) * 30)
  })
})

describe('coreReadiness', () => {
  it('isTheScoreAsAPercentageOfTheTargetsBarCappedAt100', () => {
    expect(coreReadiness(35, MAANG)).toBe(50)
    expect(coreReadiness(35, SERVICE)).toBe(47)
    expect(coreReadiness(35, { company: 'startup', role: 'intern' })).toBe(58)
    expect(coreReadiness(99, MAANG)).toBe(100)
  })
})

describe('coreGaps', () => {
  it('gapsAreConcrete', () => {
    const gaps = coreGaps(input())
    expect(gaps.map((g) => g.component)).toEqual(['modules', 'quiz', 'projects'])
    expect(gaps[0].action).toBe('OOP: finish 3 more modules')
    expect(gaps[1].action).toBe('Take the quiz for "Classes & objects"')
    expect(gaps[2].action).toBe('Verify the Library manager project')
  })

  it('modulesGapPicksTheTrackWithTheMostWeightedWorkLeft', () => {
    const modulesGap = (i: CoreInput) => coreGaps(i).find((g) => g.component === 'modules')!.action
    expect(modulesGap(input({ learn: learnFor(['oop']) }))).toBe('Networks: finish 3 more modules')
    const service = modulesGap(input({ learn: learnFor(['oop']), target: SERVICE }))
    expect(service).toMatch(/^(Networks|DBMS): finish 3 more modules$/)
    expect(modulesGap(input({ learn: { ...learnFor(['oop', 'cn']), [TRACKS[2].modules[0].id]: done(), [TRACKS[2].modules[1].id]: done() }, target: SERVICE }))).toBe('DBMS: finish 3 more modules')
  })

  it('finishingLastModulesSaysHowManyAreLeft', () => {
    const learn = learnFor(['oop', 'cn', 'dbms', 'os'])
    delete learn[TRACKS[2].modules[9].id]
    delete learn[TRACKS[2].modules[8].id]
    const gap = coreGaps(input({ learn })).find((g) => g.component === 'modules')
    expect(gap).toEqual({ component: 'modules', action: 'DBMS: finish 2 more modules' })
  })

  it('quizGapPrefersRetakingTheWeakestAttemptedModule', () => {
    const learn = { ...learnFor(['oop'], 5), [TRACKS[0].modules[3].id]: done(4), [TRACKS[0].modules[4].id]: { ...done(2), completedAt: undefined } }
    const quiz = coreGaps(input({ learn })).find((g) => g.component === 'quiz')!
    expect(quiz.action).toBe(`Retake the quiz for "${TRACKS[0].modules[4].title}" (best 2 of 5)`)
  })

  it('gitGapNamesTheFirstUnpassedChallenge', () => {
    const everythingElse = learnFor(['oop', 'cn', 'dbms', 'os'])
    const git = gitWith([...PROJECTS.flatMap((p) => p.gitMilestones.map((m) => checkKey(p.id, m))).filter((k) => !k.endsWith(':merge-conflict') && !k.endsWith(':first-commit'))])
    const gaps = coreGaps(input({ learn: everythingElse, git }))
    const g = gaps.find((x) => x.component === 'git')!
    expect(g.action).toBe('Pass the "First commit and push" challenge')
  })

  it('noGapsWhenEverythingIsDone', () => {
    const all = gitWith(PROJECTS.flatMap((p) => p.gitMilestones.map((m) => checkKey(p.id, m))))
    expect(coreGaps(input({ learn: learnFor(['oop', 'cn', 'dbms', 'os']), git: all }))).toEqual([])
  })
})

describe('focus', () => {
  const backend = { ...MAANG, focus: 'backend' } as const

  it('aBackendFocusCountsDatabasesNetworksAndOsMoreThanOop', () => {
    const systems = learnFor(['dbms', 'os', 'cn'])
    const oop = learnFor(['oop'])
    expect(coreScore(input({ learn: systems, target: backend })).parts.modules).toBeGreaterThan(coreScore(input({ learn: systems })).parts.modules)
    expect(coreScore(input({ learn: oop, target: backend })).parts.modules).toBeLessThan(coreScore(input({ learn: oop })).parts.modules)
  })

  it('aGeneralFocusChangesNothing', () => {
    const learn = learnFor(['oop', 'cn'])
    expect(coreScore(input({ learn, target: { ...MAANG, focus: 'general' } }))).toEqual(coreScore(input({ learn })))
  })

  it('aFrontendFocusLeansOnOopAndNetworks', () => {
    const oop = learnFor(['oop'])
    expect(coreScore(input({ learn: oop, target: { ...MAANG, focus: 'frontend' } })).parts.modules).toBeGreaterThan(coreScore(input({ learn: oop })).parts.modules)
  })

  it('stacksWithTheServiceTierWeighting', () => {
    const dbms = learnFor(['dbms'])
    const plain = coreScore(input({ learn: dbms, target: SERVICE })).parts.modules
    const both = coreScore(input({ learn: dbms, target: { ...SERVICE, focus: 'data' } })).parts.modules
    expect(both).toBeGreaterThan(plain)
  })
})
