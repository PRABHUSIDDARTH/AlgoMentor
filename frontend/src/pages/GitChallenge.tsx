import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { CheatSheet } from '@/components/learn/CheatSheet'
import { CheckResultView } from '@/components/learn/CheckResultView'
import { RepoLink } from '@/components/learn/RepoLink'
import { ScriptBox } from '@/components/learn/ScriptBox'
import { Button } from '@/components/ui/button'
import { GIT_CHALLENGES, GIT_CHALLENGE_BY_ID } from '@/content/learn/git-challenges'
import { PROJECT_BY_ID } from '@/content/learn/projects'
import { ApiError, checkGit } from '@/lib/api'
import { checkKey, latestRepo, PRACTICE_SCOPE, recordCheck } from '@/learn/repos'
import { useGit } from '@/learn/useGit'

/** One Git challenge. This page never calls the AI mentor and shows no hints beyond static commands. */
export default function GitChallenge() {
  const { challengeId = '' } = useParams()
  const challenge = GIT_CHALLENGE_BY_ID.get(challengeId as never)
  const git = useGit()
  const [busy, setBusy] = useState(false)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])

  if (!challenge) {
    return (
      <AppShell>
        <div className="grid content-start gap-3 px-6 py-10 sm:px-10 lg:px-14">
          <h1 className="display text-[28px]">Challenge not found</h1>
          <Link to="/git" className="underline underline-offset-[3px]">All Git challenges</Link>
        </div>
      </AppShell>
    )
  }

  const own = git.repos[PRACTICE_SCOPE]
  const fallback = own ? undefined : latestRepo(git)
  const repo = own ?? fallback
  const record = git.checks[checkKey(PRACTICE_SCOPE, challenge.id)]
  const index = GIT_CHALLENGES.findIndex((c) => c.id === challenge.id)
  const prev = GIT_CHALLENGES[index - 1]
  const next = GIT_CHALLENGES[index + 1]

  async function check() {
    if (!repo) return
    abort.current ??= new AbortController()
    const { signal } = abort.current
    const key = checkKey(PRACTICE_SCOPE, challenge!.id)
    setBusy(true)
    try {
      recordCheck(key, await checkGit(repo.owner, repo.repo, challenge!.id, signal))
    } catch (e) {
      if (!signal.aborted) recordCheck(key, { error: e instanceof ApiError ? e.message : "Couldn't reach AlgoMentor to run this check. Try again." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 px-6 py-8 sm:px-10 lg:px-14 xl:grid-cols-[minmax(0,1fr)_360px] xl:px-20">
        <article className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-7">
          <header className="grid gap-2">
            <p className="eyebrow">Git challenge {challenge.order} of {GIT_CHALLENGES.length}</p>
            <h1 className="display text-[30px] leading-tight xl:text-[36px]">{challenge.title}</h1>
            <p className="max-w-[72ch] text-[14.5px] leading-relaxed text-ink-muted">{challenge.brief}</p>
          </header>
          <p className="max-w-[72ch] border-l-2 border-sage pl-3 text-[13.5px] leading-relaxed">
            No AI on Git pages: you run Git yourself, and the check only looks at the state of your repository on GitHub.
          </p>

          <section aria-labelledby="gc-steps" className="grid gap-2">
            <h2 id="gc-steps" className="text-[18px] font-semibold">Steps</h2>
            <ol aria-label="Steps" className="grid max-w-[72ch] gap-2 pl-5 text-[14px] leading-relaxed [&>li]:list-decimal [&>li]:marker:text-ink-muted">
              {challenge.steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </section>

          {challenge.script && <ScriptBox script={challenge.script} />}
          <CheatSheet rows={challenge.cheatSheet} />

          <section aria-labelledby="gc-docs" className="grid gap-2">
            <h2 id="gc-docs" className="text-[18px] font-semibold">Official documentation</h2>
            <ul className="grid gap-1.5 text-[14px]">
              {challenge.docs.map((d) => (
                <li key={d.url}>
                  <a href={d.url} target="_blank" rel="noreferrer" className="underline underline-offset-[3px]">{d.label}<span className="sr-only"> (opens git-scm.com in a new tab)</span></a>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="gc-passes" className="grid gap-2">
            <h2 id="gc-passes" className="text-[18px] font-semibold">The check passes when</h2>
            <p className="max-w-[72ch] text-[14px] leading-relaxed">{challenge.passesWhen}</p>
          </section>

          <nav aria-label="Challenge navigation" className="flex max-w-[72ch] flex-wrap justify-between gap-3 border-t border-line pt-5 text-[13.5px]">
            {prev ? <Link to={`/git/${prev.id}`} className="underline underline-offset-[3px]">Previous: {prev.title}</Link> : <span />}
            {next ? <Link to={`/git/${next.id}`} className="underline underline-offset-[3px]">Next: {next.title}</Link> : <Link to="/git" className="underline underline-offset-[3px]">All challenges</Link>}
          </nav>
        </article>

        <aside aria-label="Check your repository" className="grid content-start gap-4 xl:sticky xl:top-6 xl:self-start">
          <section aria-labelledby="gc-check" className="grid gap-3 rounded-lg border border-line bg-sand px-5 py-5">
            <h2 id="gc-check" className="text-[16px] font-semibold">Check your repository</h2>
            {fallback && (
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Checking {fallback.owner}/{fallback.repo}, linked in {PROJECT_BY_ID.get(fallback.scope)?.title ?? 'another project'}. Link a different one below to use that instead.
              </p>
            )}
            {own ? <RepoLink scope={PRACTICE_SCOPE} linked={own} /> : <RepoLink scope={PRACTICE_SCOPE} />}
            <Button className="justify-self-start bg-ink text-cream hover:bg-ink/90" disabled={!repo || busy} onClick={check}>
              {busy ? 'Checking…' : 'Check this challenge'}
            </Button>
            <CheckResultView record={record} />
          </section>
        </aside>
      </div>
    </AppShell>
  )
}
