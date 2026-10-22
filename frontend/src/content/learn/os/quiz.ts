import type { QuizQuestion } from '../types'

/** prompt, the correct option, three wrong options, and why the answer is right. */
export type Item = [prompt: string, correct: string, wrong: [string, string, string], why: string]

/**
 * Builds a module's quiz and places each correct option so that guessing one letter never pays:
 * the slot rotates with the module number, and the fifth question is offset again.
 */
export function makeQuiz(prefix: string, moduleNumber: number, items: Item[]): QuizQuestion[] {
  return items.map(([prompt, correct, wrong, why], i) => {
    const answer = i === 4 ? (moduleNumber + 2) % 4 : (moduleNumber + i) % 4
    const options = [...wrong]
    options.splice(answer, 0, correct)
    return { id: `${prefix}-${i + 1}`, prompt, options, answer, why }
  })
}
