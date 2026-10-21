/** Test helpers: build fetch responses whose body streams the given pieces. */
export function streamOf(pieces: string[], { endOpen = false } = {}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const piece of pieces) controller.enqueue(encoder.encode(piece))
      if (!endOpen) controller.close()
    },
  })
}

export function sse(event: string, data: unknown): string {
  return `event:${event}\ndata:${JSON.stringify(data)}\n\n`
}

export function sseResponse(pieces: string[], opts?: { endOpen?: boolean }): Response {
  return new Response(streamOf(pieces, opts), { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
