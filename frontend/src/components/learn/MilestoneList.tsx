import { useEffect, useRef, useState } from 'react'
import { CheckCard } from '@/components/learn/CheckCard'
import { Button } from '@/components/ui/button'
import { CHALLENGE_TITLES, type ChallengeId } from '@/content/learn/types'
import { ApiError, checkGit } from '@/lib/api'
import { checkKey, recordCheck, type GitState } from '@/learn/repos'

interface Props {
  scope: string
  milestones: ChallengeId[]
  git: GitState
}

/** A project's Git milestones with a check for each. Checks read public GitHub data only: no AI, no code. */
export function MilestoneList({ scope, milestones, git }: Props) {
  const linked = git.repos[scope]
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set())
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])

  async function run(id: ChallengeId) {
    if (!linked) return
    abort.current ??= new AbortController()
    const { signal } = abort.current
    setBusy((b) => new Set(b).add(id))
    try {
      recordCheck(checkKey(scope, id), await checkGit(linked.owner, linked.repo, id, signal))
    } catch (e) {
      if (signal.aborted) return
      recordCheck(checkKey(scope, id), { error: e instanceof ApiError ? e.message : "Couldn't reach AlgoMentor to run this check. Try again." })
    } finally {
      setBusy((b) => {
        const next = new Set(b)
        next.delete(id)
        return next
      })
    }
  }

  async function runAll() {
    for (const id of milestones) await run(id)
  }

  const passed = milestones.filter((id) => git.checks[checkKey(scope, id)]?.passedAt !== undefined).length
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 basis-40 text-[13.5px] font-semibold">{passed} of {milestones.length} milestones passed</p>
        <Button size="sm" className="bg-ink text-cream hover:bg-ink/90" disabled={!linked || busy.size > 0} onClick={runAll}>Check all milestones</Button>
      </div>
      {!linked && <p className="text-[12.5px] text-ink-muted">Link your repository to check milestones.</p>}
      <ul aria-label="Git milestones" className="overflow-hidden rounded-lg border border-line bg-cream">
        {milestones.map((id) => (
          <CheckCard key={id} title={CHALLENGE_TITLES[id]} href={`/git/${id}`} record={git.checks[checkKey(scope, id)]} busy={busy.has(id)} disabled={!linked} onCheck={() => run(id)} />
        ))}
      </ul>
    </div>
  )
}
