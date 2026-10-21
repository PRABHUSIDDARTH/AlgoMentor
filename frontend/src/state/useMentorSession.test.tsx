import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AskPayload, Problem } from '@/lib/api'
import { loadHistory } from '@/lib/history'
import { useMentorSession } from './useMentorSession'

const api = vi.hoisted(() => ({ askStream: vi.fn(), fetchProblem: vi.fn() }))
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), ...api }))

const { ApiError, StreamCutError } = await import('@/lib/api')

const TWO_SUM: Problem = {
  number: '1', title: 'Two Sum', slug: 'two-sum', difficulty: 'Easy', tags: ['Array', 'Hash Table'],
  url: 'https://leetcode.com/problems/two-sum/', statement: 'Find two numbers.',
}

/** A stream the test controls: push chunks, then finish or fail it. */
type Call = { payload: AskPayload; signal?: AbortSignal; push: (t: string) => void; done: () => void; fail: (e: unknown) => void }
let calls: Call[] = []

beforeEach(() => {
  calls = []
  api.fetchProblem.mockResolvedValue(TWO_SUM)
  api.askStream.mockImplementation((payload: AskPayload, onChunk: (t: string) => void, signal?: AbortSignal) =>
    new Promise<string>((resolve, reject) => {
      let text = ''
      calls.push({
        payload, signal,
        push: (t) => { text += t; onChunk(t) },
        done: () => resolve(text),
        fail: reject,
      })
    }))
})

afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

async function openTwoSum() {
  const hook = renderHook(() => useMentorSession())
  await act(() => hook.result.current.openProblem('1'))
  return hook
}

async function finish(call: Call, text: string) {
  await act(async () => {
    call.push(text)
    call.done()
  })
}

describe('useMentorSession', () => {
  it('opensLeetCodeRefAndRecordsHistory', async () => {
    const { result } = await openTwoSum()
    expect(api.fetchProblem).toHaveBeenCalledWith('1', expect.any(AbortSignal))
    expect(result.current.problem).toMatchObject({ key: 'two-sum', source: 'leetcode', title: '1. Two Sum', difficulty: 'Easy' })
    expect(result.current.status).toBe('ready')
    expect(loadHistory()?.[0]).toMatchObject({ key: 'two-sum', status: 'started' })
  })

  it('pastedTextBecomesCustomProblem', async () => {
    const { result } = renderHook(() => useMentorSession())
    const text = 'Given a list of intervals, merge all overlapping intervals and return the result.'
    await act(() => result.current.openProblem(text))
    expect(api.fetchProblem).not.toHaveBeenCalled()
    expect(result.current.problem).toMatchObject({ source: 'custom', title: 'Custom: ' + text.slice(0, 40), statement: text })
  })

  it('nextHintSendsPreviousHints', async () => {
    const { result } = await openTwoSum()
    act(() => result.current.nextHint())
    await finish(calls[0], '**Hint 1:** a')
    act(() => result.current.nextHint())
    expect(calls[1].payload).toMatchObject({ mode: 'hint', problem: expect.stringContaining('Find two numbers.'), previousHints: ['**Hint 1:** a'] })
    expect(result.current.hintsRemaining).toBe(3)
  })

  it('ignoresNextHintWhileStreaming', async () => {
    const { result } = await openTwoSum()
    act(() => {
      result.current.nextHint()
      result.current.nextHint()
    })
    expect(api.askStream).toHaveBeenCalledTimes(1)
    await finish(calls[0], 'h1')
    expect(result.current.hints).toEqual(['h1'])
  })

  it('abortsStreamWhenProblemChanges', async () => {
    const { result } = await openTwoSum()
    act(() => result.current.nextHint())
    const first = calls[0]
    api.fetchProblem.mockResolvedValueOnce({ ...TWO_SUM, number: '146', title: 'LRU Cache', slug: 'lru-cache' })
    await act(() => result.current.openProblem('146'))
    expect(first.signal?.aborted).toBe(true)
    await act(async () => {
      first.push('stale text')
      first.done()
    })
    expect(result.current.problem?.key).toBe('lru-cache')
    expect(result.current.hints).toEqual([])
    expect(result.current.streaming).toBeNull()
  })

  it('solutionCachedPerLanguage', async () => {
    const { result } = await openTwoSum()
    act(() => result.current.revealSolution())
    expect(result.current.tab).toBe('solution')
    await finish(calls[0], 'python answer')
    act(() => result.current.setLanguage('java'))
    expect(calls[1].payload).toMatchObject({ mode: 'solution', language: 'java' })
    await finish(calls[1], 'java answer')
    act(() => result.current.setLanguage('python'))
    expect(api.askStream).toHaveBeenCalledTimes(2)
    expect(result.current.solution).toEqual({ python: 'python answer', java: 'java answer' })
  })

  it('followUpCarriesConversationAndRevealFlag', async () => {
    const { result } = await openTwoSum()
    act(() => result.current.askFollowUp('why a map?'))
    expect(calls[0].payload).toMatchObject({ mode: 'followup', question: 'why a map?', conversation: [], solutionRevealed: false })
    expect(result.current.streaming).toMatchObject({ tab: 'hints', followup: true })
    await finish(calls[0], 'Because lookups are O(1).')
    act(() => result.current.askFollowUp('and memory?'))
    expect(calls[1].payload.conversation).toEqual([
      { role: 'user', text: 'why a map?' },
      { role: 'mentor', text: 'Because lookups are O(1).' },
    ])
  })

  it('streamCutKeepsPartial', async () => {
    const { result } = await openTwoSum()
    act(() => result.current.explainProblem())
    await act(async () => {
      calls[0].push('half')
      calls[0].fail(new StreamCutError('half'))
    })
    expect(result.current.status).toBe('error')
    expect(result.current.error).toMatchObject({ tab: 'explain', partial: 'half' })
    act(() => result.current.retry())
    expect(calls[1].payload).toEqual(calls[0].payload)
  })

  it('rateLimitSetsCooldown', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000)
    const { result } = await openTwoSum()
    act(() => result.current.nextHint())
    await act(async () => calls[0].fail(new ApiError(429, 'Too many requests. Please wait a minute and try again.')))
    expect(result.current.cooldownUntil).toBe(1_030_000)
    expect(result.current.error?.message).toContain('Too many requests')
  })

  it('followUpErrorIsMarkedAsFollowUp', async () => {
    const { result } = await openTwoSum()
    act(() => result.current.askFollowUp('why?'))
    await act(async () => calls[0].fail(new ApiError(400, 'Follow-up questions can be at most 1000 characters.')))
    expect(result.current.error).toMatchObject({ followup: true, message: expect.stringContaining('1000') })
  })

  it('networkFailureIsFlagged', async () => {
    const { result } = await openTwoSum()
    act(() => result.current.nextHint())
    await act(async () => calls[0].fail(new TypeError('Failed to fetch')))
    expect(result.current.error).toMatchObject({ tab: 'hints', network: true })
  })

  it('editStatementResetsSession', async () => {
    const { result } = await openTwoSum()
    act(() => result.current.nextHint())
    await finish(calls[0], 'h1')
    act(() => result.current.editStatement('Find two numbers, but sorted.'))
    expect(result.current.problem?.statement).toBe('Find two numbers, but sorted.')
    expect(result.current.hints).toEqual([])
  })

  it('markSolvedUpdatesHistory', async () => {
    const { result } = await openTwoSum()
    act(() => result.current.markSolved())
    expect(result.current.solved).toBe(true)
    await waitFor(() => expect(loadHistory()?.[0].status).toBe('solved'))
  })
})
