import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import { marked, type Token, type TokensList } from 'marked'

hljs.registerLanguage('python', python)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)

export type Segment = { kind: 'html'; html: string } | { kind: 'code'; lang: string; code: string }
export type Cx = { value: string; reason: string }
export type Complexity = { time: Cx; space: Cx }

const LANG_ALIASES: Record<string, string> = { py: 'python', 'c++': 'cpp', cc: 'cpp', cxx: 'cpp' }

/**
 * Splits model Markdown into sanitized HTML runs and code blocks (rendered separately by
 * CodeBlock), and pulls out the ```complexity block the solution prompt asks for.
 */
export function splitMarkdown(md: string): { segments: Segment[]; complexity?: Complexity } {
  const tokens = marked.lexer(md)
  const segments: Segment[] = []
  let complexity: Complexity | undefined
  let run: Token[] = []

  const flush = () => {
    if (!run.length) return
    const list = Object.assign(run, { links: tokens.links }) as TokensList
    segments.push({ kind: 'html', html: sanitize(marked.parser(list)) })
    run = []
  }

  for (const token of tokens) {
    if (token.type === 'code') {
      const lang = (token.lang ?? '').trim().toLowerCase()
      if (lang === 'complexity') {
        complexity = parseComplexity(token.text) ?? complexity
        continue
      }
      flush()
      segments.push({ kind: 'code', lang: LANG_ALIASES[lang] ?? lang, code: token.text })
    } else {
      run.push(token)
    }
  }
  flush()
  return { segments, complexity }
}

function parseComplexity(text: string): Complexity | undefined {
  const read = (key: string): Cx | undefined => {
    const line = text.split('\n').find((l) => l.trim().toLowerCase().startsWith(key + ':'))
    if (!line) return undefined
    const [value, ...reason] = line.slice(line.indexOf(':') + 1).split('|')
    return { value: value.trim(), reason: reason.join('|').trim() }
  }
  const time = read('time')
  const space = read('space')
  return time && space ? { time, space } : undefined
}

export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}

/** Highlighted, escaped HTML for a code block; unknown languages are just escaped. */
export function highlight(code: string, lang: string): string {
  if (hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value
  return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
