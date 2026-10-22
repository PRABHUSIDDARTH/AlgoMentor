import { describe, expect, it } from 'vitest'
import { addHeadingIds, extractToc, slug } from './toc'

describe('toc', () => {
  it('slugLowercasesAndJoinsWords', () => {
    expect(slug('Kernel and user mode')).toBe('kernel-and-user-mode')
    expect(slug('SELECT & `JOIN`: a **fast** tour')).toBe('select-join-a-fast-tour')
  })

  it('extractsOnlyLevelTwoHeadingsOutsideCode', () => {
    const md = '## One\ntext\n### Skip me\n```c\n## not a heading\n```\n## Two words\n'
    expect(extractToc(md)).toEqual([{ id: 'one', text: 'One' }, { id: 'two-words', text: 'Two words' }])
  })

  it('duplicateHeadingsGetUniqueIds', () => {
    expect(extractToc('## Same\n## Same\n').map((t) => t.id)).toEqual(['same', 'same-2'])
  })

  it('addHeadingIdsMatchesTheTocIds', () => {
    const md = '## Creating tables\nbody\n## Same\n## Same\n'
    const html = '<h2>Creating tables</h2><p>body</p><h2>Same</h2><h2>Same</h2>'
    expect(addHeadingIds(html)).toBe('<h2 id="creating-tables">Creating tables</h2><p>body</p><h2 id="same">Same</h2><h2 id="same-2">Same</h2>')
    expect(extractToc(md).map((t) => t.id)).toEqual(['creating-tables', 'same', 'same-2'])
  })

  it('addHeadingIdsHandlesInlineMarkupAndEntities', () => {
    expect(addHeadingIds('<h2>Why <code>fork</code> &amp; exec</h2>')).toBe('<h2 id="why-fork-exec">Why <code>fork</code> &amp; exec</h2>')
  })
})
