import { readSse } from './sse'

export type Mode = 'explain' | 'hint' | 'solution' | 'followup'
export type Language = 'python' | 'java' | 'cpp'
export type Turn = { role: 'user' | 'mentor'; text: string }

export interface AskPayload {
  problem: string
  mode: Mode
  previousHints?: string[]
  language?: Language
  conversation?: Turn[]
  question?: string
  solutionRevealed?: boolean
}

export interface Problem {
  number: string
  title: string
  slug: string
  difficulty: string
  tags: string[]
  url: string
  statement: string
}

/** An error whose message came from the server and is safe to show. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** The stream ended before the server said it was done; {@link partial} is what arrived. */
export class StreamCutError extends Error {
  readonly partial: string

  constructor(partial: string) {
    super('The answer was cut off.')
    this.name = 'StreamCutError'
    this.partial = partial
  }
}

async function errorFrom(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => ({}))
  const message = typeof body?.error === 'string' ? body.error : `Something went wrong (HTTP ${res.status}). Try again.`
  return new ApiError(res.status, message)
}

function abortError(): DOMException {
  return new DOMException('The request was cancelled.', 'AbortError')
}

/** Streams an answer from /ask/stream, calling onChunk for each piece; resolves with the full text. */
export async function askStream(payload: AskPayload, onChunk: (text: string) => void, signal?: AbortSignal): Promise<string> {
  const res = await fetch('/ask/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!res.ok || !res.body) throw await errorFrom(res)

  let text = ''
  for await (const { event, data } of readSse(res.body)) {
    if (signal?.aborted) throw abortError()
    if (event === 'chunk') {
      const piece = JSON.parse(data).text as string
      text += piece
      onChunk(piece)
      if (signal?.aborted) throw abortError()
    } else if (event === 'error') {
      throw new ApiError(502, JSON.parse(data).error ?? 'AlgoMentor couldn’t get an answer right now.')
    } else if (event === 'done') {
      return text
    }
  }
  if (signal?.aborted) throw abortError()
  throw new StreamCutError(text)
}

export async function fetchProblem(ref: string, signal?: AbortSignal): Promise<Problem> {
  const res = await fetch('/problem?ref=' + encodeURIComponent(ref), { signal })
  if (!res.ok) throw await errorFrom(res)
  return res.json()
}

const PROBLEM_NUMBER = /^(?:#|lc\s*#?|leetcode\s*#?)?\s*(\d{1,5})\.?$/i
const PROBLEM_URL = /^(?:https?:\/\/)?(?:www\.)?leetcode\.(?:com|cn)\/problems\/[a-z0-9-]+\/?\S*$/i

/** Same rules as the backend's ProblemRef: a LeetCode number or problem link. */
export function looksLikeProblemRef(input: string): boolean {
  const text = input.trim()
  const number = text.match(PROBLEM_NUMBER)
  if (number) return Number(number[1]) > 0
  return PROBLEM_URL.test(text)
}

export type ProfileSite = 'leetcode' | 'hackerrank' | 'gfg'
export interface LeetCodeProfile {
  username: string
  ranking: number | null
  solved: { easy: number; medium: number; hard: number; total: number }
  topics: { tag: string; solved: number }[]
  recent: { slug: string; title: string; solvedAt: number }[]
}
export interface HackerRankProfile { username: string; badges: { name: string; stars: number; level: number; solved: number }[] }
export interface GfgProfile { username: string; solved: number; score: number; instituteRank: number | null; streak: number | null }
export type ProfileFor<S extends ProfileSite> = S extends 'leetcode' ? LeetCodeProfile : S extends 'hackerrank' ? HackerRankProfile : GfgProfile

/** Public profile stats, read by the backend (cached there for 6 hours). */
export async function fetchProfile<S extends ProfileSite>(site: S, user: string, signal?: AbortSignal, opts?: { refresh?: boolean }): Promise<ProfileFor<S>> {
  const res = await fetch(`/profiles/${site}/${encodeURIComponent(user)}${opts?.refresh ? '?refresh=true' : ''}`, { signal })
  if (!res.ok) throw await errorFrom(res)
  return res.json()
}
