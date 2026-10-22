export interface SseEvent {
  event: string
  data: string
}

/** Parses a Server-Sent Events body into events, however the bytes are split across reads. */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let match: RegExpMatchArray | null
      while ((match = buffer.match(/\r?\n\r?\n/)) && match.index !== undefined) {
        const raw = buffer.slice(0, match.index)
        buffer = buffer.slice(match.index + match[0].length)
        const event = parseEvent(raw)
        if (event) yield event
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function parseEvent(raw: string): SseEvent | null {
  let event = 'message'
  const data: string[] = []
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
  }
  return data.length || event !== 'message' ? { event, data: data.join('\n') } : null
}
