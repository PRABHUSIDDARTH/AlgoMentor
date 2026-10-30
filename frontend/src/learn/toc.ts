export type TocItem = { id: string; text: string }

/** Lowercase words joined with dashes: "Kernel and user mode" becomes "kernel-and-user-mode". */
export function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean).join('-')
}

/** Repeated headings get -2, -3 ... so every id on the page stays unique. */
export function uniqueSlug(base: string, seen: Map<string, number>): string {
  const n = (seen.get(base) ?? 0) + 1
  seen.set(base, n)
  return n === 1 ? base : `${base}-${n}`
}

/** The "##" headings of a lesson's markdown, outside code blocks. */
export function extractToc(markdown: string): TocItem[] {
  const seen = new Map<string, number>()
  const items: TocItem[] = []
  let fenced = false
  for (const line of markdown.split('\n')) {
    if (line.trimStart().startsWith('```')) fenced = !fenced
    const m = !fenced && /^## (.+)$/.exec(line)
    if (!m) continue
    const text = m[1].replace(/[`*]/g, '').trim()
    items.push({ id: uniqueSlug(slug(text), seen), text })
  }
  return items
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }

/** Gives each rendered <h2> the id extractToc produced for it. Pass one `seen` map across a lesson's html segments. */
export function addHeadingIds(html: string, seen: Map<string, number> = new Map()): string {
  return html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e])
    return `<h2 id="${uniqueSlug(slug(text), seen)}">${inner}</h2>`
  })
}
