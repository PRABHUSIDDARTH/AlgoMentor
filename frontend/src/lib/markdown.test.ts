import { describe, expect, it } from 'vitest'
import { inlineMarkdown, splitMarkdown } from './markdown'

describe('splitMarkdown', () => {
  it('extractsComplexity', () => {
    const md = 'Use a map.\n\n```complexity\ntime: O(1) | per op\nspace: O(n) | map\n```\n'
    const { segments, complexity } = splitMarkdown(md)
    expect(complexity).toEqual({ time: { value: 'O(1)', reason: 'per op' }, space: { value: 'O(n)', reason: 'map' } })
    expect(JSON.stringify(segments)).not.toContain('complexity')
    expect(JSON.stringify(segments)).not.toContain('per op')
  })

  it('splitsCodeFences', () => {
    const { segments, complexity } = splitMarkdown('Intro **bold**\n\n```python\nprint(1)\n```\n\nOutro')
    expect(complexity).toBeUndefined()
    expect(segments.map((s) => s.kind)).toEqual(['html', 'code', 'html'])
    expect(segments[1]).toEqual({ kind: 'code', lang: 'python', code: 'print(1)' })
    expect(segments[0]).toMatchObject({ kind: 'html' })
    expect((segments[0] as { html: string }).html).toContain('<strong>bold</strong>')
  })

  it('stripsDangerousHtml', () => {
    const md = 'Hi <img src=x onerror=alert(1)> <script>alert(2)</script> [x](javascript:alert(3))'
    const html = splitMarkdown(md).segments.map((s) => (s.kind === 'html' ? s.html : '')).join('')
    expect(html).not.toMatch(/onerror/i)
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/javascript:/i)
  })
})

describe('inlineMarkdown', () => {
  it('rendersCodeAndEmphasisWithoutWrappingParagraphs', () => {
    expect(inlineMarkdown('Use `final` and **never** mutate')).toBe('Use <code>final</code> and <strong>never</strong> mutate')
  })

  it('stripsScriptsAndHandlers', () => {
    expect(inlineMarkdown('a <img src=x onerror=alert(1)> <script>x</script>b')).not.toMatch(/onerror|<script/)
  })
})
