import { Check, Copy } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function Command({ label, command }: { label: string; command: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      toast.success('Command copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed', { description: 'Your browser blocked clipboard access.' })
    }
  }
  return (
    <div role="group" aria-label={label} className="overflow-hidden rounded-lg border border-band">
      <div className="flex items-center gap-2 bg-band px-3 py-1.5 font-mono text-[11px] text-on-band">
        <span>{label}</span>
        <span className="flex-1" />
        <button
          type="button"
          aria-label={`Copy ${label} command`}
          onClick={copy}
          className={cn('inline-flex items-center gap-1 rounded-[4px] border border-on-band/25 px-2 py-0.5 hover:border-on-band/60')}
        >
          {copied ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}Copy
        </button>
      </div>
      <pre className="overflow-x-auto bg-code px-3 py-3 font-mono text-[12px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--code-fg)]"><code>{command}</code></pre>
    </div>
  )
}

/** How to download and run a challenge's setup script in the learner's own clone. */
export function ScriptBox({ script }: { script: string }) {
  const id = useId()
  const base = `${window.location.origin}/git-challenges/${script}`
  const bash = `curl -fsSL ${base}.sh -o /tmp/${script}.sh && bash /tmp/${script}.sh`
  const powershell = `$f = Join-Path ([IO.Path]::GetTempPath()) '${script}.ps1'; Invoke-WebRequest ${base}.ps1 -OutFile $f; pwsh -File $f`
  return (
    <section aria-labelledby={id} className="grid gap-3 rounded-lg border border-line bg-sand px-5 py-5">
      <h2 id={id} className="text-[18px] font-semibold">Set up the challenge</h2>
      <p className="max-w-[72ch] text-[13.5px] leading-relaxed text-ink-muted">
        Run this inside your own project folder, on a clean working tree. It sets up the situation with a few commits and prints what it did.
        It never pushes and never touches your remotes or credentials. You can{' '}
        <a href={`${base}.sh`} target="_blank" rel="noreferrer" className="text-ink underline underline-offset-[3px]">read the bash script<span className="sr-only"> (opens in a new tab)</span></a>
        {' '}or{' '}
        <a href={`${base}.ps1`} target="_blank" rel="noreferrer" className="text-ink underline underline-offset-[3px]">the PowerShell script<span className="sr-only"> (opens in a new tab)</span></a>
        {' '}before you run it.
      </p>
      <Command label="bash" command={bash} />
      <Command label="PowerShell" command={powershell} />
    </section>
  )
}
