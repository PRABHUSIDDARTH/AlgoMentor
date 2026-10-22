import { marked } from 'marked'
import { splitMarkdown, type Segment } from '@/lib/markdown'
import { slug, uniqueSlug } from './toc'

export type CalloutKind = 'key' | 'gotcha' | 'interview' | 'try' | 'story'

export type Callout = {
  kind: CalloutKind
  title: string
  body: Segment[]
  /** Only on 'try': what the learner sees after they have predicted. */
  answer?: Segment[]
}

export type LessonSection = { id: string; title: string; segments: Segment[]; callouts: Callout[] }

const DEFAULT_TITLE: Record<CalloutKind, string> = {
  key: 'Key idea',
  gotcha: 'Common mistake',
  interview: 'In an interview',
  try: 'Predict, then reveal',
  story: 'In the wild',
}

/** Markdown to segments, without the empty runs that blank lines leave behind. */
const segmentsOf = (md: string): Segment[] => splitMarkdown(md).segments.filter((s) => s.kind === 'code' || s.html.trim() !== '')

const MARKER = /^\[!(KEY|GOTCHA|INTERVIEW|TRY|STORY)\][ \t]*(.*)$/

function toCallout(quote: string): Callout | null {
  const [first, ...rest] = quote.split('\n')
  const m = MARKER.exec(first.trim())
  if (!m) return null
  const kind = m[1].toLowerCase() as CalloutKind
  const title = m[2].trim() || DEFAULT_TITLE[kind]
  if (kind === 'try') {
    const at = rest.findIndex((l) => l.trim() === '---')
    if (at >= 0) {
      return {
        kind,
        title,
        body: segmentsOf(rest.slice(0, at).join('\n')),
        answer: segmentsOf(rest.slice(at + 1).join('\n')),
      }
    }
  }
  return { kind, title, body: segmentsOf(rest.join('\n')) }
}

/**
 * Splits a lesson's markdown at its "##" headings. Blockquotes that start with `[!KEY]`, `[!GOTCHA]`, `[!INTERVIEW]`,
 * `[!TRY]` or `[!STORY]` become callouts, shown beside the section they sit in; everything else is the section's prose.
 * A `[!TRY]` callout splits into question and answer at a line containing only `---`.
 * Callouts before the first heading are not extracted, so they stay as plain blockquotes in the intro.
 */
export function parseLesson(body: string): { intro: Segment[]; sections: LessonSection[] } {
  const seen = new Map<string, number>()
  const introRaw: string[] = []
  const drafts: { id: string; title: string; raw: string[]; callouts: Callout[] }[] = []

  for (const token of marked.lexer(body)) {
    if (token.type === 'heading' && token.depth === 2) {
      const title = token.text.replace(/[`*]/g, '').trim()
      drafts.push({ id: uniqueSlug(slug(title), seen), title, raw: [], callouts: [] })
      continue
    }
    const current = drafts[drafts.length - 1]
    if (!current) {
      introRaw.push(token.raw)
      continue
    }
    const callout = token.type === 'blockquote' ? toCallout(token.text) : null
    if (callout) current.callouts.push(callout)
    else current.raw.push(token.raw)
  }

  return {
    intro: segmentsOf(introRaw.join('')),
    sections: drafts.map((d) => ({ id: d.id, title: d.title, segments: segmentsOf(d.raw.join('')), callouts: d.callouts })),
  }
}
