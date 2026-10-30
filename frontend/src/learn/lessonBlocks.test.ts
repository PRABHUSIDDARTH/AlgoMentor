import { describe, expect, it } from 'vitest'
import { parseLesson } from './lessonBlocks'
import { extractToc } from './toc'

const html = (segments: { kind: string; html?: string }[]) => segments.filter((s) => s.kind === 'html').map((s) => s.html).join('')

describe('parseLesson', () => {
  it('splitsAtSecondLevelHeadingsAndGivesEachAnId', () => {
    const { sections } = parseLesson('## First idea\n\nOne.\n\n## Second idea\n\nTwo.')
    expect(sections.map((s) => [s.id, s.title])).toEqual([['first-idea', 'First idea'], ['second-idea', 'Second idea']])
    expect(html(sections[0].segments)).toContain('One.')
    expect(html(sections[0].segments)).not.toContain('Two.')
  })

  it('putsTextBeforeTheFirstHeadingInTheIntro', () => {
    const { intro, sections } = parseLesson('Before anything.\n\n## Then\n\nBody.')
    expect(html(intro)).toContain('Before anything.')
    expect(sections).toHaveLength(1)
  })

  it('usesTheSameHeadingIdsAsTheTableOfContents', () => {
    const md = '## Same\n\na\n\n## Same\n\nb\n\n## Other `code` heading\n\nc'
    expect(parseLesson(md).sections.map((s) => s.id)).toEqual(extractToc(md).map((t) => t.id))
  })

  it('pullsCalloutsOutOfTheProse', () => {
    const { sections } = parseLesson('## A\n\nBefore.\n\n> [!KEY] The big idea\n> Objects bundle **state** and behaviour.\n\nAfter.')
    const [s] = sections
    expect(s.callouts).toHaveLength(1)
    expect(s.callouts[0]).toMatchObject({ kind: 'key', title: 'The big idea' })
    expect(html(s.callouts[0].body)).toContain('<strong>state</strong>')
    expect(html(s.segments)).toContain('Before.')
    expect(html(s.segments)).toContain('After.')
    expect(html(s.segments)).not.toContain('big idea')
  })

  it('fillsInATitleWhenTheAuthorGivesNone', () => {
    const kinds = ['KEY', 'GOTCHA', 'INTERVIEW', 'TRY', 'STORY']
    const md = '## A\n\n' + kinds.map((k) => `> [!${k}]\n> text for ${k}\n\n`).join('')
    const { sections } = parseLesson(md)
    expect(sections[0].callouts.map((c) => [c.kind, c.title])).toEqual([
      ['key', 'Key idea'], ['gotcha', 'Common mistake'], ['interview', 'In an interview'], ['try', 'Predict, then reveal'], ['story', 'In the wild'],
    ])
  })

  it('leavesOrdinaryBlockquotesInTheProse', () => {
    const { sections } = parseLesson('## A\n\n> Just a quote.\n')
    expect(sections[0].callouts).toHaveLength(0)
    expect(html(sections[0].segments)).toContain('<blockquote>')
  })

  it('splitsATryCalloutIntoQuestionAndAnswerAtARule', () => {
    const md = '## A\n\n> [!TRY] What prints?\n> Guess first.\n>\n> ```java\n> System.out.println(1 + 1);\n> ```\n>\n> ---\n>\n> It prints `2`.'
    const c = parseLesson(md).sections[0].callouts[0]
    expect(c.kind).toBe('try')
    expect(c.body.some((s) => s.kind === 'code' && s.code.includes('System.out.println'))).toBe(true)
    expect(html(c.body)).toContain('Guess first.')
    expect(html(c.answer ?? [])).toContain('It prints')
    expect(html(c.body)).not.toContain('It prints')
  })

  it('doesNotSplitNonTryCalloutsAtARule', () => {
    const c = parseLesson('## A\n\n> [!KEY]\n> one\n>\n> ---\n>\n> two').sections[0].callouts[0]
    expect(c.answer).toBeUndefined()
  })

  it('sanitisesCalloutHtml', () => {
    const c = parseLesson('## A\n\n> [!KEY]\n> hi <script>alert(1)</script><img src=x onerror=alert(1)>').sections[0].callouts[0]
    expect(html(c.body)).not.toMatch(/<script|onerror/)
  })

  it('keepsCodeBlocksInTheProseAsCodeSegments', () => {
    const { sections } = parseLesson('## A\n\n```python\nprint(1)\n```\n\nText.')
    expect(sections[0].segments.map((s) => s.kind)).toEqual(['code', 'html'])
  })
})
