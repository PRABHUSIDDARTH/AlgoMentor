import type { QuizQuestion } from '@/content/learn/types'

/** Grades answers by index; a missing or -1 answer is wrong. */
export function gradeQuiz(questions: QuizQuestion[], answers: number[]): { score: number; results: boolean[] } {
  const results = questions.map((q, i) => answers[i] === q.answer)
  return { score: results.filter(Boolean).length, results }
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h
}

/** `n` distinct questions for a review re-quiz, chosen by `seed` (the day) so a reload shows the same ones. */
export function pickRequiz(questions: QuizQuestion[], seed: string, n = 3): QuizQuestion[] {
  return [...questions].sort((a, b) => hash(seed + a.id) - hash(seed + b.id)).slice(0, n)
}
