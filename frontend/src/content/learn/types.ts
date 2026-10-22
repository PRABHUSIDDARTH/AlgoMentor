export type TrackId = 'oop' | 'cn' | 'dbms'

export type QuizQuestion = { id: string; prompt: string; options: string[]; answer: number; why: string }

export type Lesson = {
  id: string
  title: string
  minutes: number
  /** Markdown, rendered through the app's sanitising renderer. */
  body: string
  /** Key into the diagram registry (components/learn/diagrams). */
  diagram?: string
  code?: { java: string; python: string; cpp: string }
  quiz: QuizQuestion[]
  interview: { q: string; a: string }[]
}

export type Track = { id: TrackId; title: string; short: string; summary: string; modules: Lesson[]; projects: string[] }
