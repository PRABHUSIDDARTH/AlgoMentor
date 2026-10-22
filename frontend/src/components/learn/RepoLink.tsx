import { ExternalLink } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { linkRepo, parseRepoUrl, unlinkRepo, type LinkedRepo } from '@/learn/repos'

interface Props {
  scope: string
  linked?: LinkedRepo
}

/** Link (or unlink) the public GitHub repository for a project. Only the owner and name are kept. */
export function RepoLink({ scope, linked }: Props) {
  const id = useId()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (linked) {
    return (
      <div className="grid gap-2">
        <p className="text-[13.5px]">
          Linked:{' '}
          <a href={`https://github.com/${linked.owner}/${linked.repo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium underline underline-offset-[3px]">
            {linked.owner}/{linked.repo}
            <ExternalLink className="size-3" aria-hidden="true" />
            <span className="sr-only">(opens GitHub)</span>
          </a>
        </p>
        <Button variant="outline" size="sm" className="justify-self-start border-line-strong bg-transparent" onClick={() => unlinkRepo(scope)}>Unlink repository</Button>
      </div>
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseRepoUrl(text)
    if ('error' in parsed) {
      setError(parsed.error)
      return
    }
    setError(null)
    setText('')
    linkRepo(scope, parsed.owner, parsed.repo)
  }

  return (
    <form onSubmit={submit} className="grid gap-2" noValidate>
      <label htmlFor={id} className="text-[13px] font-medium">GitHub repository link</label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="https://github.com/you/your-repo"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 basis-56 bg-cream"
        />
        <Button type="submit" className="bg-ink text-cream hover:bg-ink/90">Link repository</Button>
      </div>
      {error && <p id={`${id}-err`} role="alert" className="text-[12.5px] text-danger">{error}</p>}
      <p className="text-[12px] leading-relaxed text-ink-muted">The repository must be public. AlgoMentor reads commits, branches and tags through GitHub's public API. It never reads your code.</p>
    </form>
  )
}
