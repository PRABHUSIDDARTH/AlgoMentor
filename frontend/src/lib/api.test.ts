import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse, sse, sseResponse } from '@/test/streams'
import { ApiError, askStream, looksLikeProblemRef, StreamCutError } from './api'

afterEach(() => vi.unstubAllGlobals())

const payload = { problem: 'Two Sum', mode: 'hint' as const }

describe('askStream', () => {
  it('resolvesFullTextOnDone', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([sse('chunk', { text: '**Hint' }), sse('chunk', { text: ' 1:**' }), sse('done', {})])))
    const chunks: string[] = []
    await expect(askStream(payload, (t) => chunks.push(t))).resolves.toBe('**Hint 1:**')
    expect(chunks).toEqual(['**Hint', ' 1:**'])
  })

  it('throwsApiErrorWithServerMessage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(429, { error: 'Too many requests. Please wait a minute and try again.' })))
    const err = await askStream(payload, () => {}).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(429)
    expect(err.message).toBe('Too many requests. Please wait a minute and try again.')
  })

  it('throwsStreamCutWithPartial', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([sse('chunk', { text: 'half an ans' })])))
    const err = await askStream(payload, () => {}).catch((e) => e)
    expect(err).toBeInstanceOf(StreamCutError)
    expect(err.partial).toBe('half an ans')
  })

  it('rejectsOnErrorEvent', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([sse('error', { error: 'The model returned an empty answer.' })])))
    const err = await askStream(payload, () => {}).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('The model returned an empty answer.')
  })

  it('abortStopsReading', async () => {
    // The body never ends on its own, so only the abort can finish this request.
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([sse('chunk', { text: 'a' })], { endOpen: true })))
    const controller = new AbortController()
    const chunks: string[] = []
    const pending = askStream(payload, (t) => {
      chunks.push(t)
      controller.abort()
    }, controller.signal)
    const err = await pending.catch((e) => e)
    expect(err.name).toBe('AbortError')
    expect(chunks).toEqual(['a'])
  })

  it('sendsThePayloadAsJson', async () => {
    const fetchMock = vi.fn(async () => sseResponse([sse('chunk', { text: 'x' }), sse('done', {})]))
    vi.stubGlobal('fetch', fetchMock)
    await askStream({ ...payload, previousHints: ['h1'], language: 'java' }, () => {})
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/ask/stream')
    expect(JSON.parse(init.body as string)).toEqual({ problem: 'Two Sum', mode: 'hint', previousHints: ['h1'], language: 'java' })
  })
})

describe('looksLikeProblemRef', () => {
  it.each(['1', '#1', 'LC 146', 'https://leetcode.com/problems/two-sum/'])('accepts %s', (input) => {
    expect(looksLikeProblemRef(input)).toBe(true)
  })

  it.each(['two sum', 'Given an array of 1'])('rejects %s', (input) => {
    expect(looksLikeProblemRef(input)).toBe(false)
  })
})
