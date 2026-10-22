import { createElement } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DIAGRAMS } from '@/components/learn/diagrams'
import { TRACKS } from '.'

/** Module ids in the order spec §3 lists them. */
const SPEC_ORDER: Record<string, string[]> = {
  oop: ['classes-objects', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction-interfaces', 'solid', 'composition', 'design-patterns', 'uml', 'oop-interviews'],
  cn: ['network-models', 'physical-data-link', 'ip-subnetting', 'routing', 'tcp-udp', 'dns', 'http-tls', 'sockets', 'cdn-lb-nat', 'type-a-url'],
  dbms: ['er-models', 'relational-keys', 'sql-basics', 'joins-subqueries', 'normalisation', 'transactions-acid', 'concurrency-isolation', 'indexing', 'query-optimisation', 'nosql-cap'],
}

const words = (md: string) => md.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length

describe.each(TRACKS.map((t) => [t.id, t] as const))('%s content', (id, track) => {
  it('tenModulesInSpecOrder', () => {
    expect(track.modules.map((m) => m.id)).toEqual(SPEC_ORDER[id])
  })

  it.each(track.modules.map((m) => [m.id, m] as const))('bodyLength400to900Words: %s', (_, m) => {
    const n = words(m.body)
    expect(n, `${m.id} has ${n} words`).toBeGreaterThanOrEqual(400)
    expect(n, `${m.id} has ${n} words`).toBeLessThanOrEqual(900)
  })

  it('fiveQuizQuestionsAnswerInRange', () => {
    for (const m of track.modules) {
      expect(m.quiz, m.id).toHaveLength(5)
      for (const q of m.quiz) {
        expect(q.options.length, q.id).toBeGreaterThanOrEqual(3)
        expect(new Set(q.options).size, `${q.id} has duplicate options`).toBe(q.options.length)
        expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, q.id).toBe(true)
      }
    }
  })

  it('answersAreSpreadAcrossPositions', () => {
    const answers = track.modules.flatMap((m) => m.quiz.map((q) => q.answer))
    const counts = [0, 1, 2, 3].map((i) => answers.filter((a) => a === i).length)
    // Guessing one letter must not pay: no position may hold more than 40% of a track's answers.
    for (const c of counts) expect(c / answers.length, `answer positions ${counts.join('/')}`).toBeLessThanOrEqual(0.4)
  })

  it('whyExplainsEveryAnswer', () => {
    for (const q of track.modules.flatMap((m) => m.quiz)) expect(q.why.trim().length, q.id).toBeGreaterThan(20)
  })

  it('interviewTwoToFour', () => {
    for (const m of track.modules) {
      expect(m.interview.length, m.id).toBeGreaterThanOrEqual(2)
      expect(m.interview.length, m.id).toBeLessThanOrEqual(4)
      for (const i of m.interview) expect(i.q.trim() && i.a.trim().length > 30, m.id).toBeTruthy()
    }
  })

  it('oopHasThreeLanguages', () => {
    for (const m of track.modules) {
      if (id === 'oop') for (const lang of ['java', 'python', 'cpp'] as const) expect(m.code?.[lang]?.trim(), `${m.id} ${lang}`).toBeTruthy()
    }
  })

  it('diagramAtLeastEveryOtherModule', () => {
    const has = track.modules.map((m) => !!m.diagram)
    for (let i = 0; i + 1 < has.length; i += 2) expect(has[i] || has[i + 1], `modules ${i + 1}–${i + 2}`).toBe(true)
  })

  it('diagramsHaveAriaLabel', () => {
    for (const m of track.modules.filter((x) => x.diagram)) {
      const Diagram = DIAGRAMS[m.diagram!]
      expect(Diagram, `${m.id} diagram ${m.diagram}`).toBeDefined()
      const { container, unmount } = render(createElement(Diagram))
      const svg = container.querySelector('svg')!
      expect(svg.getAttribute('role'), m.diagram).toBe('img')
      expect(svg.getAttribute('aria-label')?.length ?? 0, m.diagram).toBeGreaterThan(20)
      expect(container.innerHTML, `${m.diagram} uses a hard-coded colour`).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(/i)
      unmount()
    }
  })
})

describe('all tracks', () => {
  it('noDuplicateIds', () => {
    const modules = TRACKS.flatMap((t) => t.modules.map((m) => m.id))
    expect(new Set(modules).size).toBe(modules.length)
    const questions = TRACKS.flatMap((t) => t.modules.flatMap((m) => m.quiz.map((q) => q.id)))
    expect(new Set(questions).size).toBe(questions.length)
  })
})
