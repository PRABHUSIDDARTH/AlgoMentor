import { afterEach, describe, expect, it, vi } from 'vitest'
import { HISTORY_KEY, historyKey, loadHistory, statusLine, upsertHistory, type HistoryEntry } from './history'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    key: 'two-sum', source: 'leetcode', number: '1', slug: 'two-sum', title: '1. Two Sum', difficulty: 'Easy',
    status: 'started', hintsUsed: 0, hints: [], updatedAt: 1, ...overrides,
  }
}

describe('history', () => {
  it('capsAt30NewestFirst', () => {
    for (let i = 0; i < 35; i++) upsertHistory(entry({ key: `p${i}`, title: `P${i}`, updatedAt: i }))
    const list = loadHistory()!
    expect(list).toHaveLength(30)
    expect(list[0].key).toBe('p34')
    expect(list[29].key).toBe('p5')
  })

  it('mergesByKeyAndKeepsHighestStatus', () => {
    upsertHistory(entry({ status: 'solved', updatedAt: 1 }))
    const list = upsertHistory(entry({ status: 'hints', hintsUsed: 1, hints: ['h1'], updatedAt: 2 }))
    expect(list).toHaveLength(1)
    expect(list[0].status).toBe('solved')
    expect(list[0].hintsUsed).toBe(1)
    expect(list[0].updatedAt).toBe(2)
  })

  it('treatsCorruptJsonAsEmpty', () => {
    localStorage.setItem(HISTORY_KEY, '{not json')
    expect(loadHistory()).toEqual([])
    expect(upsertHistory(entry())).toHaveLength(1)
  })

  it('dropsEntriesThatAreNotValidRecords', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([{ nope: true }, entry()]))
    expect(loadHistory()).toEqual([entry()])
  })

  it('dropsEntriesWithWrongFieldTypes', () => {
    const good = entry()
    localStorage.setItem(HISTORY_KEY, JSON.stringify([
      { ...good, key: 'a', difficulty: 5 },
      { ...good, key: 'b', hints: [42] },
      { ...good, key: 'c', source: 'elsewhere' },
      { ...good, key: 'd', status: 'toString' },
      { ...good, key: 'e', statement: 7 },
      { ...good, key: 'f', title: '' },
      good,
    ]))
    expect(loadHistory()?.map((e) => e.key)).toEqual(['two-sum'])
  })

  it('survivesQuotaError', () => {
    upsertHistory(entry({ key: 'a', updatedAt: 1 }))
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    let list: HistoryEntry[] = []
    expect(() => (list = upsertHistory(entry({ key: 'b', updatedAt: 2 })))).not.toThrow()
    expect(list.map((e) => e.key)).toEqual(['b', 'a'])
  })

  it('returnsNullWhenStorageThrowsOnRead', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(loadHistory()).toBeNull()
  })

  it('statusLineFormats', () => {
    expect(statusLine(entry({ status: 'hints', hintsUsed: 2 }))).toBe('Hint 2 of 4')
    expect(statusLine(entry({ status: 'solution' }))).toBe('Solution viewed')
    expect(statusLine(entry({ status: 'explained' }))).toBe('Explained')
    expect(statusLine(entry({ status: 'solved' }))).toBe('Solved')
    expect(statusLine(entry({ status: 'started' }))).toBe('Started')
    expect(statusLine(entry({ source: 'custom', status: 'hints', hintsUsed: 2 }))).toBe('Pasted · 2 hints')
  })

  it('keysLeetCodeBySlugAndCustomByHash', () => {
    expect(historyKey({ slug: 'two-sum', statement: 'x' })).toBe('two-sum')
    const a = historyKey({ statement: 'Merge intervals' })
    expect(a).toMatch(/^custom:[0-9a-f]{8}$/)
    expect(historyKey({ statement: 'Merge intervals' })).toBe(a)
    expect(historyKey({ statement: 'Merge intervals!' })).not.toBe(a)
  })
})
