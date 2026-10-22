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
import { recordSolve } from '@/practice/progress'

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
  /** The failed request was a follow-up question, shown under the follow-up box. */
  followup?: boolean
}

export interface SessionState {
  problem: ProblemContext | null
  tab: Tab
  hints: string[]
  /** `followup` marks a follow-up answer streaming under `tab`, not the tab's own content. */
  streaming: { tab: Tab; text: string; followup?: boolean } | null
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
// Follow-up payload budget: the server caps entries at 6,000 chars and request bodies at 64 KB.
const MAX_TURN_CHARS = 6000
const MAX_CONVERSATION_CHARS = 30_000
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

/** Keeps a follow-up conversation inside the server's limits: long answers are shortened, oldest exchanges dropped. */
export function budgetConversation(turns: Turn[]): Turn[] {
  const capped = turns.map((t) => (t.text.length > MAX_TURN_CHARS ? { ...t, text: t.text.slice(0, MAX_TURN_CHARS - 1) + '…' } : t))
  let total = capped.reduce((n, t) => n + t.text.length, 0)
  let start = 0
  while (total > MAX_CONVERSATION_CHARS && start < capped.length) {
    // Drop a whole question-and-answer pair so the thread still starts with the student.
    total -= capped[start].text.length + (capped[start + 1]?.text.length ?? 0)
    start += 2
  }
  return capped.slice(start)
}

type Request = { tab: Tab; payload: AskPayload; onDone: (text: string) => void; followup?: boolean }

/** All workspace state for one problem at a time: hints, explanation, solutions, follow-ups. */
export function useMentorSession() {
  const [state, dispatch] = useReducer(reducer, initial)
  const [history, setHistory] = useState<HistoryEntry[] | null>(() => loadHistory())
  // Refs, not state: they must be current even within one batch of clicks.
  const controller = useRef<AbortController | null>(null)
  const loadController = useRef<AbortController | null>(null)
  const busy = useRef(false)
  /** A problem is being fetched: no requests until it arrives (they'd target the old one). */
  const loading = useRef(false)
  const lastRequest = useRef<Request | null>(null)
  const stateRef = useRef(state)
  /** Set when the problem was opened from the roadmap, so solving it counts there too. */
  const roadmapId = useRef<string | undefined>(undefined)
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
    if (busy.current || loading.current) return
    busy.current = true
    lastRequest.current = request
    const ac = new AbortController()
    controller.current = ac
    dispatch({ status: 'streaming', error: undefined, streaming: { tab: request.tab, text: '', followup: request.followup } })

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
        const error: SessionError = { tab: request.tab, message: NETWORK_MESSAGE, followup: request.followup }
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
    cancel()
    lastRequest.current = null
    const hints = restore?.hints.slice(0, MAX_HINTS) ?? []
    dispatch({ ...fresh, problem, hints, solved: restore?.status === 'solved', status: 'ready', tab: 'hints' })
    record(problem, 'started', hints)
  }, [cancel, record])

  const load = useCallback(async (ref: string, restore?: HistoryEntry) => {
    cancel()
    loadController.current?.abort()
    const ac = new AbortController()
    loadController.current = ac
    loading.current = true
    dispatch({ status: 'loadingProblem', error: undefined })
    try {
      const problem = fromLeetCode(await fetchProblem(ref, ac.signal))
      if (ac.signal.aborted) return
      loading.current = false
      start(problem, restore)
    } catch (err) {
      if (ac.signal.aborted) return
      loading.current = false
      const network = !(err instanceof ApiError)
      dispatch({
        status: stateRef.current.problem ? 'ready' : 'idle',
        error: { tab: 'problem', message: network ? NETWORK_MESSAGE : (err as ApiError).message, network },
      })
    }
  }, [cancel, start])

  const openProblem = useCallback(async (input: string, opts?: { roadmapProblemId?: string }) => {
    const text = input.trim()
    if (!text) return
    roadmapId.current = opts?.roadmapProblemId
    if (looksLikeProblemRef(text)) return load(text)
    loadController.current?.abort()
    loading.current = false
    start(fromText(text))
  }, [cancel, load, start])

  const openEntry = useCallback(async (entry: HistoryEntry) => {
    roadmapId.current = undefined
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
    if (busy.current) return
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
      followup: true,
      payload: { problem: promptText(p), mode: 'followup', previousHints: hints, conversation: budgetConversation(followups), question: q, solutionRevealed },
      onDone: (text) => dispatch((s) => ({ followups: [...s.followups, { role: 'user', text: q }, { role: 'mentor', text }] })),
    })
  }, [run])

  /** Asks for the solution in the current language (e.g. after a failed language switch). */
  const fetchCurrentSolution = useCallback(() => requestSolution(stateRef.current.language), [requestSolution])

  const markSolved = useCallback(() => {
    const p = stateRef.current.problem
    if (!p) return
    dispatch({ solved: true })
    record(p, 'solved')
    // Seeing the solution counts like a hint: a review isn't passed by reading the answer.
    const { hints, solutionRevealed } = stateRef.current
    if (roadmapId.current) recordSolve(roadmapId.current, { hintsUsed: hints.length + (solutionRevealed ? 1 : 0) })
  }, [record])

  const retry = useCallback(() => {
    if (lastRequest.current) run(lastRequest.current)
  }, [run])

  const setTab = useCallback((tab: Tab) => dispatch({ tab }), [])

  /** Back to the empty state ("New problem"); history and language are kept. */
  const reset = useCallback(() => {
    roadmapId.current = undefined
    cancel()
    loadController.current?.abort()
    loading.current = false
    lastRequest.current = null
    dispatch({ ...fresh, problem: null, status: 'idle', tab: 'hints', cooldownUntil: undefined })
  }, [cancel])

  return {
    ...state,
    history,
    hintsRemaining: MAX_HINTS - state.hints.length,
    /** The learner had help on this problem: a hint or the revealed solution. */
    assisted: state.hints.length > 0 || state.solutionRevealed,
    openProblem, openEntry, editStatement, setTab, explainProblem, nextHint, revealSolution, setLanguage,
    askFollowUp, markSolved, retry, reset, requestSolution: fetchCurrentSolution,
  }
}

export type MentorSession = ReturnType<typeof useMentorSession>
