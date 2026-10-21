import { useMemo } from 'react'
import type { Language } from '@/lib/api'
import { splitMarkdown } from '@/lib/markdown'
import { cn } from '@/lib/utils'
import { CodeBlock } from './CodeBlock'
import { ComplexityPanel } from './ComplexityPanel'

interface Props {
  markdown: string
  streaming?: boolean
  /** Solution code: show language switches on code blocks. */
  language?: Language
  onLanguage?: (l: Language) => void
  className?: string
}

export function AnswerView({ markdown, streaming, language, onLanguage, className }: Props) {
  const { segments, complexity } = useMemo(() => splitMarkdown(markdown), [markdown])
  return (
    <div className={cn('prose-am', streaming && 'streaming-am', className)} aria-busy={streaming || undefined}>
      {segments.map((s, i) =>
        s.kind === 'html' ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: s.html }} />
        ) : (
          <CodeBlock
            key={i}
            code={s.code}
            lang={s.lang}
            languages={onLanguage ? ['python', 'java', 'cpp'] : undefined}
            activeLanguage={language}
            onLanguage={onLanguage}
          />
        ),
      )}
      {streaming && segments.length === 0 && <span aria-hidden="true" className="caret-am" />}
      {complexity && !streaming && <ComplexityPanel complexity={complexity} />}
    </div>
  )
}
