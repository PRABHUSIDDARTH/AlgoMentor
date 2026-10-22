import { describe, expect, it } from 'vitest'
import { streamOf } from '@/test/streams'
import { readSse } from './sse'

async function collect(pieces: string[]) {
  const events = []
  for await (const e of readSse(streamOf(pieces))) events.push(e)
  return events
}

describe('readSse', () => {
  it('parsesChunksSplitAcrossReads', async () => {
    const events = await collect(['event:chu', 'nk\ndata:{"text":"a"}\n', '\nevent:done\ndata:{}\n\n'])
    expect(events).toEqual([
      { event: 'chunk', data: '{"text":"a"}' },
      { event: 'done', data: '{}' },
    ])
  })

  it('handlesCrlf', async () => {
    const events = await collect(['event: chunk\r\ndata: {"text":"b"}\r\n\r\n'])
    expect(events).toEqual([{ event: 'chunk', data: '{"text":"b"}' }])
  })

  it('joinsMultiLineData', async () => {
    const events = await collect(['data:line one\ndata:line two\n\n'])
    expect(events).toEqual([{ event: 'message', data: 'line one\nline two' }])
  })
})
