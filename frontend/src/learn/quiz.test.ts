import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '@/content/learn/types'
import { gradeQuiz, pickRequiz } from './quiz'

const q = (id: string, answer: number): QuizQuestion => ({ id, prompt: id, options: ['a', 'b', 'c', 'd'], answer, why: 'because' })
const FIVE = [q('q1', 0), q('q2', 1), q('q3', 2), q('q4', 3), q('q5', 0)]

describe('gradeQuiz', () => {
  it('gradeQuiz', () => {
    expect(gradeQuiz(FIVE, [0, 1, 2, 3, 0])).toEqual({ score: 5, results: [true, true, true, true, true] })
    expect(gradeQuiz(FIVE, [0, 0, 2, 0, 0])).toEqual({ score: 3, results: [true, false, true, false, true] })
  })

  it('unansweredCountsAsWrong', () => {
    expect(gradeQuiz(FIVE, [0, -1, 2]).score).toBe(2)
  })
})

describe('pickRequiz', () => {
  it('picksThreeDistinctQuestionsDeterministically', () => {
    const a = pickRequiz(FIVE, '2026-10-22')
    expect(a).toHaveLength(3)
    expect(new Set(a.map((x) => x.id)).size).toBe(3)
    expect(pickRequiz(FIVE, '2026-10-22')).toEqual(a)
  })
})
