import { useCallback, useReducer, useRef, useState } from 'react'
import {
  ApiError,
  askStream,
  fetchProblem,
  looksLikeProblemRef,
  StreamCutError,
  type AskPayload,
  type Language,
  type Problem,
  type Turn,
} from '@/lib/api'
import { historyKey, loadHistory, upsertHistory, type HistoryEntry, type HistoryStatus } from '@/lib/history'

export type Tab = 'explain' | 'hints' | 'solution'

export interface ProblemContext {
  key: string
  source: 'leetcode' | 'custom'
  title: string
  statement: string
  number?: string
  slug?: string
  difficulty?: string
  tags: string[]
  url?: string
}

export interface SessionError {
  tab: Tab | 'problem'
  message: string
  /** Text received before a stream was cut off. */
  partial?: string
  /** The request never reached the server (offline, DNS, ...). */
  network?: boolean
}

export interface SessionState {
  problem: ProblemContext | null
  tab: Tab
  hints: string[]
  streaming: { tab: Tab; text: string } | null
  explain?: string
  solution: Partial<Record<Language, string>>
  language: Language
  followups: Turn[]
  solutionRevealed: boolean
  solved: boolean
  status: 'idle' | 'loadingProblem' | 'ready' | 'streaming' | 'error'
  error?: SessionError
  cooldownUntil?: number
}

export const MAX_HINTS = 4
export const MAX_FOLLOWUP_TURNS = 10
const COOLDOWN_MS = 30_000
const NETWORK_MESSAGE = 'Could not reach AlgoMentor. Check your connection and try again.'

const fresh = {
  hints: [] as string[],
  streaming: null,
  explain: undefined,
  solution: {},
  followups: [] as Turn[],
  solutionRevealed: false,
  solved: false,
  error: undefined,
}

const initial: SessionState = { problem: null, tab: 'hints', language: 'python', status: 'idle', ...fresh }

type Patch = Partial<SessionState> | ((s: SessionState) => Partial<SessionState>)

function reducer(state: SessionState, patch: Patch): SessionState {
  return { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
}

/** What the model sees: the title line, then the statement. */
export function promptText(p: ProblemContext): string {
  return p.source === 'leetcode' ? `${p.title} (${p.difficulty})\n\n${p.statement}` : p.statement
}

function fromLeetCode(p: Problem): ProblemContext {
  return {
    key: historyKey({ slug: p.slug, statement: p.statement }), source: 'leetcode', title: `${p.number}. ${p.title}`,
    statement: p.statement, number: p.number, slug: p.slug, difficulty: p.difficulty, tags: p.tags, url: p.url,
  }
}

function fromText(text: string): ProblemContext {
  const statement = text.trim()
  return { key: historyKey({ statement }), source: 'custom', title: 'Custom: ' + statement.slice(0, 40), statement, tags: [] }
}

type Request = { tab: Tab; payload: AskPayload; onDone: (text: string) => void }

/** All workspace state for one problem at a time: hints, explanation, solutions, follow-ups. */
export function useMentorSession() {
  const [state, dispatch] = useReducer(reducer, initial)
  const [history, setHistory] = useState<HistoryEntry[] | null>(() => loadHistory())
  // Refs, not state: they must be current even within one batch of clicks.
  const controller = useRef<AbortController | null>(null)
  const busy = useRef(false)
  const lastRequest = useRef<Request | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const record = useCallback((p: ProblemContext, status: HistoryStatus, hints?: string[]) => {
    const used = hints ?? stateRef.current.hints
    setHistory(upsertHistory({
      key: p.key, source: p.source, number: p.number, slug: p.slug, title: p.title, difficulty: p.difficulty,
      statement: p.source === 'custom' ? p.statement : undefined,
      status, hintsUsed: used.length, hints: used, updatedAt: Date.now(),
    }))
  }, [])

  const cancel = useCallback(() => {
    controller.current?.abort()
    controller.current = null
    busy.current = false
  }, [])

  const run = useCallback((request: Request) => {
    if (busy.current) return
    busy.current = true
    lastRequest.current = request
    const ac = new AbortController()
    controller.current = ac
    dispatch({ status: 'streaming', error: undefined, streaming: { tab: request.tab, text: '' } })

    askStream(request.payload, (chunk) => {
      if (ac.signal.aborted) return
      dispatch((s) => ({ streaming: s.streaming && { ...s.streaming, text: s.streaming.text + chunk } }))
    }, ac.signal)
      .then((text) => {
        if (ac.signal.aborted) return
        busy.current = false
        dispatch({ status: 'ready', streaming: null })
        request.onDone(text)
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return
        busy.current = false
        const error: SessionError = { tab: request.tab, message: NETWORK_MESSAGE }
        let cooldownUntil: number | undefined
        if (err instanceof StreamCutError) {
          error.message = err.message
          error.partial = err.partial
        } else if (err instanceof ApiError) {
          error.message = err.message
          if (err.status === 429) cooldownUntil = Date.now() + COOLDOWN_MS
        } else {
          error.network = true
        }
        dispatch({ status: 'error', streaming: null, error, ...(cooldownUntil ? { cooldownUntil } : {}) })
      })
  }, [])

  const start = useCallback((problem: ProblemContext, restore?: HistoryEntry) => {
    const hints = restore?.hints.slice(0, MAX_HINTS) ?? []
    dispatch({ ...fresh, problem, hints, solved: restore?.status === 'solved', status: 'ready', tab: 'hints' })
    record(problem, 'started', hints)
  }, [record])

  const load = useCallback(async (ref: string, restore?: HistoryEntry) => {
    cancel()
    const ac = new AbortController()
    controller.current = ac
    dispatch({ status: 'loadingProblem', error: undefined })
    try {
      const problem = fromLeetCode(await fetchProblem(ref, ac.signal))
      if (ac.signal.aborted) return
      controller.current = null
      start(problem, restore)
    } catch (err) {
      if (ac.signal.aborted) return
      controller.current = null
      const network = !(err instanceof ApiError)
      dispatch({
        status: stateRef.current.problem ? 'ready' : 'idle',
        error: { tab: 'problem', message: network ? NETWORK_MESSAGE : (err as ApiError).message, network },
      })
    }
  }, [cancel, start])

  const openProblem = useCallback(async (input: string) => {
    const text = input.trim()
    if (!text) return
    if (looksLikeProblemRef(text)) return load(text)
    cancel()
    start(fromText(text))
  }, [cancel, load, start])

  const openEntry = useCallback(async (entry: HistoryEntry) => {
    if (entry.source === 'custom' && entry.statement) {
      cancel()
      return start(fromText(entry.statement), entry)
    }
    return load(entry.slug ?? entry.number ?? entry.key, entry)
  }, [cancel, load, start])

  const editStatement = useCallback((text: string) => {
    const p = stateRef.current.problem
    if (!p || !text.trim()) return
    cancel()
    const edited = p.source === 'custom' ? fromText(text) : { ...p, statement: text.trim() }
    start(edited)
  }, [cancel, start])

  const explainProblem = useCallback(() => {
    const p = stateRef.current.problem
    if (!p) return
    run({
      tab: 'explain', payload: { problem: promptText(p), mode: 'explain' },
      onDone: (text) => {
        dispatch({ explain: text })
        record(p, 'explained')
      },
    })
  }, [record, run])

  const nextHint = useCallback(() => {
    const { problem: p, hints } = stateRef.current
    if (!p || hints.length >= MAX_HINTS || busy.current) return
    run({
      tab: 'hints', payload: { problem: promptText(p), mode: 'hint', previousHints: hints },
      onDone: (text) => {
        const next = [...hints, text]
        dispatch({ hints: next })
        record(p, 'hints', next)
      },
    })
  }, [record, run])

  const requestSolution = useCallback((language: Language) => {
    const p = stateRef.current.problem
    if (!p) return
    run({
      tab: 'solution', payload: { problem: promptText(p), mode: 'solution', language },
      onDone: (text) => {
        dispatch((s) => ({ solution: { ...s.solution, [language]: text } }))
        record(p, 'solution')
      },
    })
  }, [record, run])

  /** The caller confirms first when hints remain (RevealDialog). */
  const revealSolution = useCallback(() => {
    const { problem, solution, language } = stateRef.current
    if (!problem) return
    dispatch({ solutionRevealed: true, tab: 'solution' })
    if (!solution[language]) requestSolution(language)
  }, [requestSolution])

  const setLanguage = useCallback((language: Language) => {
    dispatch({ language })
    const { solutionRevealed, solution } = stateRef.current
    if (solutionRevealed && !solution[language]) requestSolution(language)
  }, [requestSolution])

  const askFollowUp = useCallback((question: string) => {
    const { problem: p, hints, followups, solutionRevealed, tab } = stateRef.current
    const q = question.trim()
    if (!p || !q || followups.length >= MAX_FOLLOWUP_TURNS * 2) return
    run({
      tab,
      payload: { problem: promptText(p), mode: 'followup', previousHints: hints, conversation: followups, question: q, solutionRevealed },
      onDone: (text) => dispatch((s) => ({ followups: [...s.followups, { role: 'user', text: q }, { role: 'mentor', text }] })),
    })
  }, [run])

  const markSolved = useCallback(() => {
    const p = stateRef.current.problem
    if (!p) return
    dispatch({ solved: true })
    record(p, 'solved')
  }, [record])

  const retry = useCallback(() => {
    if (lastRequest.current) run(lastRequest.current)
  }, [run])

  const setTab = useCallback((tab: Tab) => dispatch({ tab }), [])

  /** Back to the empty state ("New problem"); history and language are kept. */
  const reset = useCallback(() => {
    cancel()
    lastRequest.current = null
    dispatch({ ...fresh, problem: null, status: 'idle', tab: 'hints', cooldownUntil: undefined })
  }, [cancel])

  return {
    ...state,
    history,
    hintsRemaining: MAX_HINTS - state.hints.length,
    openProblem, openEntry, editStatement, setTab, explainProblem, nextHint, revealSolution, setLanguage,
    askFollowUp, markSolved, retry, reset,
  }
}

export type MentorSession = ReturnType<typeof useMentorSession>
