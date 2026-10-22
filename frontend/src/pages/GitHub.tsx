import { Link } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { GIT_CHALLENGES } from '@/content/learn/git-challenges'
import { passedChallenges } from '@/learn/repos'
import { useGit } from '@/learn/useGit'

const day = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const HOW = [
  'Link a public GitHub repository (your own project is ideal).',
  'Read the challenge and, where there is one, run its setup script in your clone.',
  'Use Git to fix the situation yourself, then push.',
  'Press Check. AlgoMentor looks at your repository on GitHub and tells you what is still missing.',
]

/** The ten Git challenges. This page never calls the AI mentor. */
export default function GitHub() {
  const git = useGit()
  const passed = passedChallenges(git)
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-7 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader
          eyebrow="Git"
          title="Fix real Git problems in your own repository."
          summary="These are your commits in your repository, so there is no AI on these pages: you read the brief, use Git yourself, and the check only looks at what is on GitHub."
        />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="git-list" className="grid content-start gap-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 id="git-list" className="text-[18px] font-semibold">Challenges</h2>
              <p className="font-mono text-[12px] text-ink-muted">{passed.size} of {GIT_CHALLENGES.length} challenges passed</p>
            </div>
            <ol aria-label="Challenges" className="overflow-hidden rounded-lg border border-line bg-cream">
              {GIT_CHALLENGES.map((c) => {
                const at = passed.get(c.id)
                return (
                  <li key={c.id} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
                    <span aria-hidden="true" className="w-6 shrink-0 font-mono text-[12px] text-ink-muted">{c.order}</span>
                    <Link to={`/git/${c.id}`} className="min-w-0 flex-1 text-[14px] font-medium underline-offset-[3px] hover:underline">{c.title}</Link>
                    <span className="shrink-0 font-mono text-[11.5px] text-ink-muted">{at === undefined ? c.script ? 'Setup script' : '' : `Passed ${day(at)}`}</span>
                  </li>
                )
              })}
            </ol>
          </section>
          <aside aria-label="How it works" className="grid content-start gap-3 rounded-lg border border-line bg-sand px-5 py-5">
            <h2 className="text-[16px] font-semibold">How it works</h2>
            <ol className="grid gap-2.5 pl-5 text-[13.5px] leading-relaxed [&>li]:list-decimal [&>li]:marker:text-ink-muted">
              {HOW.map((t) => <li key={t}>{t}</li>)}
            </ol>
            <p className="text-[12.5px] leading-relaxed text-ink-muted">
              Checks use GitHub's public data only, so the repository must be public. Progress is saved in this browser. Link a repository on a <Link to="/learn" className="text-ink underline underline-offset-[3px]">project page</Link> and these challenges will use it.
            </p>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
