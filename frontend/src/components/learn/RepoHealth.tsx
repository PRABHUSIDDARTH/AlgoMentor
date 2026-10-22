import { useEffect, useRef, useState } from 'react'
import { CheckDetailsList } from '@/components/learn/CheckResultView'
import { RepoLink } from '@/components/learn/RepoLink'
import { Button } from '@/components/ui/button'
import { ApiError, repoHealth } from '@/lib/api'
import type { CheckDetail } from '@/learn/repos'
import { useGit } from '@/learn/useGit'

type Result = { details: CheckDetail[] } | { error: string }

/** "Make your GitHub shine": checks a linked public repository for what recruiters look at first. */
export function RepoHealth({ scope }: { scope: string }) {
  const git = useGit()
  const linked = git.repos[scope]
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])

  // A different repository makes the old findings meaningless.
  const repoName = linked ? `${linked.owner}/${linked.repo}`.toLowerCase() : ''
  useEffect(() => setResult(null), [repoName])

  async function check() {
    if (!linked) return
    abort.current ??= new AbortController()
    const { signal } = abort.current
    setBusy(true)
    try {
      setResult({ details: (await repoHealth(linked.owner, linked.repo, signal)).details })
    } catch (e) {
      if (!signal.aborted) setResult({ error: e instanceof ApiError ? e.message : "Couldn't reach AlgoMentor to check this repository. Try again." })
    } finally {
      setBusy(false)
    }
  }

  const done = result && 'details' in result ? result.details.filter((d) => d.ok).length : 0
  return (
    <div className="grid gap-3">
      <p className="max-w-[72ch] text-[13px] leading-relaxed text-ink-muted">
        Link the repository for this project. The check looks for a README with sections and a screenshot, tests, a CI workflow, a license, topics, a demo link, at least 20 meaningful commits and a release tag.
      </p>
      <RepoLink scope={scope} linked={linked} />
      <Button variant="outline" className="justify-self-start border-line-strong bg-transparent" disabled={!linked || busy} onClick={check}>
        {busy ? 'Checking…' : 'Check repository'}
      </Button>
      {result && 'error' in result && <p className="text-[12.5px] leading-relaxed text-danger">{result.error}</p>}
      {result && 'details' in result && (
        <div className="grid gap-2">
          <p className="font-mono text-[11.5px] text-ink">{done} of {result.details.length} items done</p>
          <CheckDetailsList details={result.details} />
        </div>
      )}
    </div>
  )
}
