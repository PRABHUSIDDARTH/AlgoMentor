import { Check, Copy, WrapText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Language } from '@/lib/api'
import { highlight } from '@/lib/markdown'
import { cn } from '@/lib/utils'

const NAMES: Record<string, string> = { python: 'Python', java: 'Java', cpp: 'C++' }

interface Props {
  code: string
  lang: string
  /** When given, shows language switches (solution code). */
  languages?: Language[]
  activeLanguage?: Language
  onLanguage?: (l: Language) => void
  languagesDisabled?: boolean
}

export function CodeBlock({ code, lang, languages, activeLanguage, onLanguage, languagesDisabled }: Props) {
  const [wrap, setWrap] = useState(false)
  const [copied, setCopied] = useState(false)
  const html = useMemo(() => highlight(code, lang), [code, lang])
  const lines = code.split('\n').length

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Code copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed', { description: 'Your browser blocked clipboard access.' })
    }
  }

  const ctl = 'rounded-[4px] border border-on-band/25 px-2 py-0.5 hover:border-on-band/60 aria-pressed:border-sage-soft aria-pressed:text-sage-soft'
  return (
    <figure className="my-3 overflow-hidden rounded-lg border border-band">
      <figcaption className="flex flex-wrap items-center gap-2 bg-band px-3 py-1.5 font-mono text-[11px] text-on-band">
        <span>{lang || 'code'}</span>
        <span className="flex-1" />
        {languages?.map((l) => (
          <button key={l} type="button" className={cn(ctl, 'disabled:opacity-50')} disabled={languagesDisabled} aria-pressed={l === activeLanguage} onClick={() => onLanguage?.(l)}>{NAMES[l]}</button>
        ))}
        <button type="button" className={cn(ctl, 'inline-flex items-center gap-1')} aria-pressed={wrap} aria-label="Wrap lines" onClick={() => setWrap((w) => !w)}>
          <WrapText className="size-3" aria-hidden="true" />Wrap
        </button>
        <button type="button" className={cn(ctl, 'inline-flex items-center gap-1')} aria-label="Copy code" onClick={copy}>
          {copied ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}Copy
        </button>
      </figcaption>
      <div className="code-am flex bg-code py-3 font-mono text-[12px] leading-[1.75] text-[var(--code-fg)]">
        {!wrap && (
          <pre aria-hidden="true" className="select-none pr-3.5 pl-2 text-right text-[var(--code-comment)]">
            {Array.from({ length: lines }, (_, i) => i + 1).join('\n')}
          </pre>
        )}
        <pre className={cn('min-w-0 flex-1 pr-4', wrap ? 'pl-4 break-words whitespace-pre-wrap' : 'overflow-x-auto')}>
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </figure>
  )
}
